import { ValidationErrors, ValidatorFn } from '@angular/forms';

/** Cross-field rules; required and length are handled by Angular's built-in validators. */
export const passwordChangeValidator: ValidatorFn = (form): ValidationErrors | null => {
  const currentPassword = form.get('currentPassword')?.value;
  const newPassword = form.get('newPassword')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;
  const errors: ValidationErrors = {};

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors['passwordUnchanged'] = true;
  }
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors['passwordMismatch'] = true;
  }
  return Object.keys(errors).length ? errors : null;
};
