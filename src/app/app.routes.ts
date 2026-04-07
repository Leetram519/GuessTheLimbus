import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'games/guess-id'
	},
	{
		path: 'games/guess-id',
		title: 'Guess The Limbus - Guess the ID',
		data: {
			gameKey: 'guess-id'
		},
		loadComponent: () =>
			import('./pages/guess-id/guess-id-page.component').then(component => component.GuessIdPageComponent)
	},
	{
		path: 'games/guess-ego',
		title: 'Guess The Limbus - Guess the EGO',
		data: {
			gameKey: 'guess-ego',
			gameTitle: 'Guess the EGO',
			gameDescription: 'A dedicated EGO guessing mode with its own rules and progression.'
		},
		loadComponent: () =>
			import('./pages/game-coming-soon/game-coming-soon-page.component').then(
				component => component.GameComingSoonPageComponent
			)
	},
	{
		path: 'games/endless',
		title: 'Guess The Limbus - Endless',
		data: {
			gameKey: 'endless',
			gameTitle: 'Endless Mode',
			gameDescription: 'An endless challenge mode with continuous rounds and no daily lock.'
		},
		loadComponent: () =>
			import('./pages/game-coming-soon/game-coming-soon-page.component').then(
				component => component.GameComingSoonPageComponent
			)
	},
	{
		path: '**',
		redirectTo: 'games/guess-id'
	}
];
