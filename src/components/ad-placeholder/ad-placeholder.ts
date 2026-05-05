import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-ad-placeholder',
  standalone: true,
  templateUrl: './ad-placeholder.html',
  styleUrls: ['./ad-placeholder.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdPlaceholder {
        private static adSenseScriptPromise: Promise<void> | null = null;

    @Input() width = 9999;
    @Input() height = 9999;
    @Input() adClient = 'ca-pub-1070072434264812';
    @Input() adSlot = '2914632082';
    @Input() adFormat = 'auto';
    @Input() fullWidthResponsive = true;

    @ViewChild('adIns', { static: false }) adIns?: ElementRef<HTMLElement>;

    readonly message = "This is supposed to be an ad, but no worries if you're using an adblocker!\n\
    If you're not using an adblocker, then something broke in the website! Please report the bug, and I'll get back to you on Github.\n\
    The ads help pay for the website, so if you like GTL don't hesitate to remove your adblocker for a bit!";

    protected showFallback = true;
    private readonly isBrowser: boolean;
    private observer?: MutationObserver;
    private adRequested = false;
    private renderTimeoutId?: number;
    private readonly logPrefix = '[AdPlaceholder]';

    constructor(
        @Inject(PLATFORM_ID) platformId: object,
        @Inject(DOCUMENT) private readonly document: Document
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

}