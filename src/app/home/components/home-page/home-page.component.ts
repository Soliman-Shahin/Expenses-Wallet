import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent extends BaseComponent implements OnInit {
  selectedMonth!: { month: number; year: number };
  constructor() {
    super();
  }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe((data) => {
      this.headerService.updateButtonConfig({
        title: data['title'],
      });
    });
  }

  onMonthChange(value: { month: number; year: number }): void {
    this.selectedMonth = value;
  }
}
