import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { map } from 'rxjs';
import { BaseComponent } from 'src/app/shared/base';
import { CategoriesService } from '../../services';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
})
export class AddCategoryComponent extends BaseComponent implements OnInit {
  private categoryService = inject(CategoriesService);
  categoryForm: FormGroup = this.initFormGroup();

  constructor() {
    super();
  }

  ngOnInit() {
    this.activatedRoute.data.subscribe((data) => {
      this.headerService.updateButtonConfig({
        title: data['title'],
        action: data['action'],
        icon: data['icon'],
        callback: this.addCategory.bind(this),
      });
    });
  }

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

  selectIcon(icon: string): void {
    const control = this.categoryForm.get('icon');
    if (control) {
      control.setValue(icon);
    }
  }

  addCategory(): void {
    const category = this.categoryForm.value;
    console.log('category', category);
    this.categoryService.createCategory(category).pipe(
      map((response) => {
        console.log('category created', response);
        return response
      })
    ).subscribe(data =>{
      console.log('data', data);
      this.routerService.navigate(['/categories/list']);
    })
  }
}
