import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { routes } from './app.routes';

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      onSameUrlNavigation: 'reload',
      preloadingStrategy: PreloadAllModules,
      enableTracing: false, // Enable tracing for debugging purposes
      bindToComponentInputs: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}