import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { ShopCategory, ShopProduct } from '../../../core/models/shop-product.model';
import { ProductMedia } from '../../../core/models/product-media.model';
import { ShopCatalogService } from '../../../core/services/shop-catalog.service';
import { BrlCurrencyPipe, parseBrlCurrency } from '../../../shared/pipes/brl-currency.pipe';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ToastService } from '../../../core/services/toast.service';

interface ProductDraft {
  name: string;
  description: string;
  category: ShopCategory | '';
  price: string;
  stockQuantity: number;
  active: boolean;
  badge: string;
  imageUrl: string;
  imageAlt: string;
}

const EMPTY_DRAFT: ProductDraft = { name: '', description: '', category: '', price: '', stockQuantity: 0, active: true, badge: '', imageUrl: '', imageAlt: '' };

@Component({
  selector: 'app-products-page',
  imports: [BrlCurrencyPipe, FormsModule, RouterLink, FaIconComponent, SelectModule, StepperModule, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
})
export class ProductsPage {
  private readonly route = inject(ActivatedRoute);
  readonly catalog = inject(ShopCatalogService);
  private readonly toast = inject(ToastService);
  readonly plusIcon = faPlus;
  private readonly currencyFormatter = new BrlCurrencyPipe();
  readonly categoryOptions = [
    { label: 'Brincos', value: 'brincos' },
    { label: 'Colares', value: 'colares' },
    { label: 'Pulseiras', value: 'pulseiras' },
    { label: 'Conjuntos', value: 'conjuntos' },
  ];
  readonly availabilityOptions = [
    { label: 'Ativo na loja', value: true },
    { label: 'Inativo na loja', value: false },
  ];
  readonly badgeOptions = [
    { label: 'Sem destaque', value: '' },
    { label: 'Mais vendido', value: 'MAIS VENDIDO' },
    { label: 'Peça única', value: 'PEÇA ÚNICA' },
    { label: 'Novo', value: 'NOVO' },
  ];
  readonly selectedProductId = signal<string | null>(this.route.snapshot.queryParamMap.has('novo') ? null : (this.catalog.products()[0]?.id ?? null));
  readonly selectedProduct = computed(() => this.catalog.products().find(product => product.id === this.selectedProductId()));
  readonly pendingMedia = signal<ProductMedia[]>([]);
  readonly media = this.pendingMedia.asReadonly();
  readonly step = signal(1);
  readonly search = signal('');
  readonly filteredProducts = computed(() => this.catalog.products().filter(product => product.name.toLocaleLowerCase('pt-BR').includes(this.search().toLocaleLowerCase('pt-BR'))));
  draft: ProductDraft = this.selectedProduct() ? this.toDraft(this.selectedProduct()!) : { ...EMPTY_DRAFT };
  error = '';
  feedback = '';
  saving = false;
  uploadingMedia = false;
  private initializedSelection = false;

  constructor() {
    effect(() => {
      if (this.initializedSelection) return;
      if (this.route.snapshot.queryParamMap.has('novo')) { this.initializedSelection = true; return; }
      const first = this.catalog.products()[0];
      if (first) { this.initializedSelection = true; this.selectProduct(first.id); }
    });
  }

  selectProduct(productId: string): void {
    const product = this.catalog.find(productId);
    if (!product) return;
    this.selectedProductId.set(productId);
    this.step.set(1);
    this.pendingMedia.set([...(product.media ?? [])]);
    this.draft = this.toDraft(product);
    this.error = '';
    this.feedback = '';
  }

  startNewProduct(): void {
    this.initializedSelection = true;
    this.selectedProductId.set(null);
    this.step.set(1);
    this.pendingMedia.set([]);
    this.draft = { ...EMPTY_DRAFT };
    this.error = '';
    this.feedback = '';
  }

  async saveProduct(): Promise<void> {
    if (this.step() !== 2 && !this.selectedProductId()) { this.nextStep(); return; }
    if (!this.validateBasics()) { this.step.set(1); return; }
    const category = this.draft.category;
    if (!category) return;
    const price = this.parsePrice(this.draft.price);
    const existing = this.selectedProduct();
    const product: ShopProduct = {
      id: existing?.id ?? '',
      name: this.draft.name.trim(),
      description: this.draft.description.trim() || `Peça artesanal ${this.draft.name.trim()} feita com carinho.`,
      price,
      imageUrl: this.draft.imageUrl,
      imageAlt: this.draft.imageAlt.trim() || this.draft.name.trim(),
      category,
      stockQuantity: Number(this.draft.stockQuantity),
      active: this.draft.active,
      badge: this.draft.badge || undefined,
      isBestSeller: this.draft.badge === 'MAIS VENDIDO',
      isNew: this.draft.badge === 'NOVO',
      media: this.pendingMedia(),
    };
    this.saving = true;
    try {
      const saved = await this.catalog.save(product);
      this.selectedProductId.set(saved.id);
      this.pendingMedia.set([...(saved.media ?? [])]);
      this.draft = this.toDraft(saved);
      this.error = '';
      this.feedback = existing ? 'Alterações salvas na API.' : 'Produto cadastrado na API.';
      this.toast.success(this.feedback);
    } catch (error) {
      this.error = error instanceof Error && error.message.startsWith('A API em execução')
        ? error.message
        : 'Não foi possível salvar o produto na API. Confira a conexão e tente novamente.';
      this.feedback = '';
      this.toast.error(this.error);
    } finally {
      this.saving = false;
    }
  }

  nextStep(): void {
    if (!this.validateBasics()) return;
    this.error = '';
    this.step.set(2);
  }

  canContinue(): boolean {
    const price = this.parsePrice(this.draft.price);
    return !!this.draft.imageUrl && !!this.draft.name.trim() && !!this.draft.category &&
      Number.isFinite(price) && price >= 0 && Number.isInteger(Number(this.draft.stockQuantity)) &&
      Number(this.draft.stockQuantity) >= 0 && !(this.draft.badge === 'PEÇA ÚNICA' && Number(this.draft.stockQuantity) > 1);
  }

  private validateBasics(): boolean {
    if (!this.canContinue()) {
      this.error = this.draft.badge === 'PEÇA ÚNICA' && Number(this.draft.stockQuantity) > 1
        ? 'Peça única deve ter no máximo 1 unidade em estoque.'
        : 'Preencha nome, categoria, preço, estoque e foto principal.';
      this.feedback = '';
      this.toast.warn(this.error);
      return false;
    }
    return true;
  }

  formatPrice(): void {
    const parsed = parseBrlCurrency(this.draft.price);
    if (Number.isFinite(parsed) && parsed >= 0) this.draft.price = this.currencyFormatter.transform(parsed);
  }

  async onMainPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      this.draft.imageUrl = await this.readPhoto(file);
      this.draft.imageAlt = this.draft.name || 'Foto do produto';
      this.error = '';
    } catch (error) { this.error = error instanceof Error ? error.message : 'Não foi possível carregar a foto.'; this.toast.warn(this.error); }
    input.value = '';
  }

  async addMediaFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.uploadingMedia = true;
    try {
      const selected: ProductMedia[] = [];
      for (const file of files) {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const url = type === 'video' ? await this.readVideo(file) : await this.readPhoto(file);
        selected.push({ id: crypto.randomUUID(), type, url, alt: file.name });
      }
      this.pendingMedia.update(items => [...items, ...selected]);
      this.feedback = `${selected.length} ${selected.length === 1 ? 'arquivo adicionado' : 'arquivos adicionados'} à galeria. Salve o produto para publicar.`;
      this.toast.success(this.feedback, 'Mídia adicionada');
      this.error = '';
    } catch (error) { this.error = error instanceof Error ? error.message : 'Não foi possível carregar a mídia.'; this.toast.warn(this.error); }
    finally { this.uploadingMedia = false; }
    input.value = '';
  }

  removeMedia(mediaId: string): void {
    this.pendingMedia.update(items => items.filter(item => item.id !== mediaId));
    this.feedback = 'Mídia removida da edição. Salve o produto para aplicar.';
  }
  moveMedia(mediaId: string, direction: -1 | 1): void {
    this.pendingMedia.update(items => {
      const next = [...items];
      const index = next.findIndex(item => item.id === mediaId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= next.length) return items;
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  private toDraft(product: ShopProduct): ProductDraft {
    return { name: product.name, description: product.description, category: product.category, price: this.currencyFormatter.transform(product.price), stockQuantity: product.stockQuantity, active: product.active !== false, badge: product.badge ?? (product.isBestSeller ? 'MAIS VENDIDO' : ''), imageUrl: product.imageUrl, imageAlt: product.imageAlt };
  }

  private parsePrice(value: string): number {
    return parseBrlCurrency(value);
  }

  private readVideo(file: File): Promise<string> {
    if (!['video/mp4', 'video/webm'].includes(file.type)) return Promise.reject(new Error('Escolha um vídeo MP4 ou WebM.'));
    if (file.size > 10 * 1024 * 1024) return Promise.reject(new Error('O vídeo deve ter até 10 MB.'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Não foi possível ler o vídeo.'));
      reader.readAsDataURL(file);
    });
  }

  private async readPhoto(file: File): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
    if (file.size > 5 * 1024 * 1024) throw new Error('A foto deve ter até 5 MB.');
    const image = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 900 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .82);
    } finally { image.close(); }
  }
}
