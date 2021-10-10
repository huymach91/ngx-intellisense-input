import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { IntellisenseInputModule } from './intellisense-input.module';

@NgModule({
  imports: [BrowserModule, FormsModule, IntellisenseInputModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
