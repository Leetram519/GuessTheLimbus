import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-cookie-policy-page',
  templateUrl: './cookies.html',
  styleUrls: ['./cookies.css'],
})
export class CookiePolicyPage {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
  ) {
    this.title.setTitle('Cookie Policy | Guess The Limbus');
    this.meta.updateTag({
      name: 'description',
      content: 'Read the cookie policy for Guess The Limbus and its Google integrations.',
    });
  }
}