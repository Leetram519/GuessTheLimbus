import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-of-service-page',
  templateUrl: './terms.html',
  styleUrls: ['./terms.css'],
})
export class TermsOfServicePage {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
  ) {
    this.title.setTitle('Terms of Service | Guess The Limbus');
    this.meta.updateTag({
      name: 'description',
      content: 'Read the terms for using Guess The Limbus.',
    });
  }
}