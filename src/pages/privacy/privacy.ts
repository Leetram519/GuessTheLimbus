import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy-policy-page',
  templateUrl: './privacy.html',
  styleUrls: ['./privacy.css'],
})
export class PrivacyPolicyPage {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
  ) {
    this.title.setTitle('Privacy Policy | Guess The Limbus');
    this.meta.updateTag({
      name: 'description',
      content: 'Read how Guess The Limbus handles gameplay data and analytics.',
    });
  }
}