import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Category } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private firestore: AngularFirestore) {}

  // Function to add a new category
  addCategory(category: Category): Promise<any> {
    return this.firestore.collection('categories').add(category);
  }

  // Function to get all categories
  getCategories(): Observable<any[]> {
    return this.firestore.collection('categories').valueChanges();
  }
}
