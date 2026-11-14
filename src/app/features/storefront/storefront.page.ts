import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopCatalogService } from '../../core/services/shop-catalog.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

interface HeroSlide {
  src: string;
  alt: string;
  imageClass: string;
}

@Component({
  selector: 'app-storefront-page',
  imports: [RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './storefront.page.html',
  styleUrl: './storefront.page.scss',
})
export class StorefrontPage implements OnInit, OnDestroy {
  readonly catalog = inject(ShopCatalogService);
  readonly featuredProducts = computed(() => this.catalog.activeProducts().slice(0, 4));
  readonly slides: HeroSlide[] = [
    { src: '/images/hero-conjunto.png', alt: 'Conjunto de colar e brincos artesanais em exposição', imageClass: 'hero-carousel__image--conjunto' },
    { src: '/images/hero-candy.png', alt: 'Brincos coloridos com corrente e contas candy', imageClass: 'hero-carousel__image--candy' },
    { src: '/images/hero-perolas.png', alt: 'Brincos de pérolas com franjas brancas', imageClass: 'hero-carousel__image--perolas' },
  ];
  readonly activeSlide = signal(0);
  readonly autoplayPaused = signal(false);
  private autoplayTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.autoplayPaused.set(true);
    }
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.pauseAutoplay();
  }

  startAutoplay(): void {
    if (typeof window === 'undefined' || this.autoplayPaused() || this.autoplayTimer) return;
    this.autoplayTimer = window.setInterval(() => this.nextSlide(), 3000);
  }

  pauseAutoplay(): void {
    if (this.autoplayTimer) clearInterval(this.autoplayTimer);
    this.autoplayTimer = undefined;
  }

  toggleAutoplay(): void {
    this.autoplayPaused.update(paused => !paused);
    if (this.autoplayPaused()) this.pauseAutoplay();
    else this.startAutoplay();
  }

  nextSlide(): void {
    this.activeSlide.update(index => (index + 1) % this.slides.length);
  }

  previousSlide(): void {
    this.activeSlide.update(index => (index - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
  }
}
