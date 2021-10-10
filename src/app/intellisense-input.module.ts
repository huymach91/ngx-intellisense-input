import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SafeHtmlPipe } from './compile.pipe';
import { IntellisenseInputComponent } from './intellisense-input.component';

@NgModule({
  imports: [CommonModule],
  declarations: [IntellisenseInputComponent, SafeHtmlPipe],
  exports: [IntellisenseInputComponent],
  bootstrap: [],
})
export class IntellisenseInputModule {}
