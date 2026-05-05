import { isPlatformBrowser } from "@angular/common";
import { Component, Inject, Output, PLATFORM_ID } from "@angular/core";
import { EventEmitter } from "@angular/core";

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {
    private readonly isBrowser: boolean;
    @Output() onNewsInteract:EventEmitter<any> = new EventEmitter();

    constructor(
        @Inject(PLATFORM_ID) platformId: object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }
  
    openNewsModal() {
        this.onNewsInteract.emit('openedNews');
    }
  
    openBugReport() {
        if (!this.isBrowser) {
            return;
        }

        window.open('https://github.com/Leetram519/GuessTheLimbus/issues', '_blank');
    }
}