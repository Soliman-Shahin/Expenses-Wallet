import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriesService } from '../../services';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
})
export class AddCategoryComponent {
  categoryForm: FormGroup = this.initFormGroup();

  colors = [
    { name: 'Red', colorCode: '#eb445a' },
    { name: 'Green', colorCode: '#28ba62' },
    { name: 'Blue', colorCode: '#3880ff' },
    { name: 'Yellow', colorCode: '#e0ac08' },
    { name: 'Black', colorCode: '#121212' },
    { name: 'Silver', colorCode: '#4d4d4d' },
    { name: 'White', colorCode: '#e7e7e7' },
    { name: 'Purple', colorCode: '#5d58e0' },
  ];

  icons = [
    'call-outline',
    'cart-outline',
    'bag-remove-outline',
    'football-outline',
    'airplane-outline',
    'build-outline',
    'card-outline',
    'business-outline',
    'bus-outline',
    'fast-food-outline',
    'phone-portrait-outline',
    'pizza-outline',
    'print-outline',
    'receipt-outline',
    'reader-outline',
    'restaurant-outline',
    'shirt-outline',
    'cafe-outline',
    'cellular-outline',
    'construct-outline',
    'game-controller-outline',
    'flash-outline',
    'fitness-outline',
    'gift-outline',
    'library-outline',
    'newspaper-outline',
    'shirt-outline',
    'storefront-outline',
    'subway-outline',
    'train-outline',
    'tv-outline',
    'wifi-outline',
    'folder-outline',
    'bookmark-outline',
    'star-outline',
    'heart-outline',
    'flag-outline',
    'cog-outline',
    'home-outline',
    'medal-outline',
    'trophy-outline',
    'umbrella-outline',
    'paper-plane-outline',
    'leaf-outline',
    'film-outline',
    'camera-outline',
    'image-outline',
    'car-outline',
    'thermometer-outline',
    'barcode-outline',
    'book-outline',
    'time-outline',
    'map-outline',
    'location-outline',
    'trash-outline',
    'key-outline',
  ];

  constructor(
    private categoryService: CategoriesService,
    private router: Router
  ) {}

  private initFormGroup(): FormGroup {
    return new FormGroup({
      title: new FormControl(''),
      icon: new FormControl(''),
      color: new FormControl(''),
    });
  }

  selectColor(color: any) {
    const control = this.categoryForm.get('color');
    if (control) {
      control.setValue(color.colorCode);
    }
  }

  selectColors(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const color = { name: 'custom', colorCode: inputElement.value };
    const control = this.categoryForm.get('color');
    if (control) {
      control.setValue(color.colorCode);
    }
  }

  selectIcon(icon: string): void {
    const control = this.categoryForm.get('icon');
    if (control) {
      control.setValue(icon);
    }
  }

  addCategory(): void {
    const category = this.categoryForm.value;
    // this.categoryService.addCategory(category);
    this.router.navigate(['/categories']);
  }
}
