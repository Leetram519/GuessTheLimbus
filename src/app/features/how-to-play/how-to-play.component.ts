import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gtl-how-to-play',
  templateUrl: './how-to-play.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }']
})
export class HowToPlayComponent {}
