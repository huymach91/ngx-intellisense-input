import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NgxIntellisenseInputModule } from './ngx-intellisense-input.module';

@NgModule({
  imports: [BrowserModule, FormsModule, NgxIntellisenseInputModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
