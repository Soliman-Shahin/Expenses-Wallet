import { Component, OnInit } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  ItemReorderEventDetail,
} from '@ionic/angular';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  categories: any = [];
  pageSize = 10;
  currentPage = 0;
  totalItems = 0;

  constructor() {}

  ngOnInit() {
    this.generateItems();
  }

  private generateItems() {
    const count = this.categories.length + 1;
    for (let i = 0; i < 50; i++) {
      this.categories.push(`Item ${count + i}`);
    }
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.generateItems();
    setTimeout(() => {
      ev.target.complete();
    }, 500);
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);

    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group
    ev.detail.complete();
  }

  handleInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.categories = this.categories.filter(
      (d: any) => d.toLowerCase().indexOf(query) > -1
    );
  }
}
