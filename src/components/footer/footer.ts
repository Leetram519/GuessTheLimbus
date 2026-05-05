import { isPlatformBrowser } from "@angular/common";
import { Component, Inject, Output, PLATFORM_ID } from "@angular/core";
import { EventEmitter } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
    imports: [RouterLink],
})
export class Footer {
    private readonly isBrowser: boolean;
    @Output() onNewsInteract:EventEmitter<any> = new EventEmitter();

    constructor(
        @Inject(PLATFORM_ID) platformId: object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }
}