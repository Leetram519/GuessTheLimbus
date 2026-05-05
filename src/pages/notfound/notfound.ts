import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    template: "<p>Page not found</p>",
})
export class NotFoundPage implements OnInit {
    constructor(private router: Router) {}

    ngOnInit(): void {
        this.router.navigate(["/idguess"]);
    }
}