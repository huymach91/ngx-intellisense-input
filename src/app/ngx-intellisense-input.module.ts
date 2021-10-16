import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SafeHtmlPipe } from './compile.pipe';
import { NgxIntellisenseInputComponent } from './ngx-intellisense-input.component';

@NgModule({
  imports: [CommonModule],
  declarations: [NgxIntellisenseInputComponent, SafeHtmlPipe],
  exports: [NgxIntellisenseInputComponent],
  bootstrap: [],
})
export class NgxIntellisenseInputModule {}
