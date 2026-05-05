import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../components/header/header';
import { NewsFeed } from '../components/news/news';
import { Footer } from '../components/footer/footer';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet, Header, NewsFeed, Footer]
})
export class App {
  protected readonly title = signal('front');
  showNewsModal = signal<boolean>(false);

  openNews() {
    this.showNewsModal.set(true);
  }

  closeNews() {
    this.showNewsModal.set(false);
  }
}
