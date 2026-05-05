import { Component, Output, EventEmitter } from "@angular/core";

@Component({
  selector: 'app-news-feed',
  templateUrl: './news.html',
  styleUrls: ['./news.css'],
})
export class NewsFeed {
    @Output() closeNewsModal:EventEmitter<any> = new EventEmitter();

    closeModal() {
        this.closeNewsModal.emit(true);
    }
}