import { Routes } from '@angular/router';
import { IdGuessPage } from '../pages/hero/hero';
import { NotFoundPage } from '../pages/notfound/notfound';
import { PrivacyPolicyPage } from '../pages/privacy/privacy';
import { TermsOfServicePage } from '../pages/terms/terms';
import { CookiePolicyPage } from '../pages/cookies/cookies';

export const routes: Routes = [
    {
        component: IdGuessPage,
        path: "idguess"
    },
    {
        component: PrivacyPolicyPage,
        path: "privacy-policy"
    },
    {
        component: TermsOfServicePage,
        path: "terms-of-service"
    },
    {
        component: CookiePolicyPage,
        path: "cookie-policy"
    },
    {
        component: NotFoundPage,
        path: '**'
    }
];
