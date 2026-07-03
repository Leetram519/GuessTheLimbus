import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-how-to-play',
  standalone: true,
  templateUrl: './how-to-play.html',
  styleUrls: ['./how-to-play.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HowToPlayComponent {}
