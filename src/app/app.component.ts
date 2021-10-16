import { Component, OnInit } from '@angular/core';
import {
  IIntellisenseInputConfig,
  INTELLISENSE_INPUT_TYPE,
} from './ngx-intellisense-input.component';
import { validateFormula } from './ngx-intellisense-input.helper';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public intelisenseInputSingleConfig: IIntellisenseInputConfig;
  public intelisenseInputMultipleConfig: IIntellisenseInputConfig;
  public formula;
  public fomulaError = {};
  public queryText;

  constructor() {}

  public onChangeFormula(data: any) {
    this.fomulaError = validateFormula(
      data.value,
      this.intelisenseInputSingleConfig.references
    );
    this.formula = data;
  }

  public onChangeQueryText(value: any) {
    this.queryText = value;
  }

  ngOnInit() {
    this.loadReferencesFromApi();
  }

  public loadReferencesFromApi() {
    setTimeout(() => {
      this.intelisenseInputSingleConfig = {
        type: INTELLISENSE_INPUT_TYPE.SINGLE,
        references: ['#TOTAL', '#SUBTOTAL', '#UNITS'],
        initialValue: '',
        placeholder: "Type '#' to make a reference",
        dividerIndex: 1,
        limit: 4,
      };

      this.intelisenseInputMultipleConfig = {
        type: INTELLISENSE_INPUT_TYPE.MULTIPLE,
        references: [
          '#SELECT',
          '#FROM',
          '#WHERE',
          '#ORDER BY',
          '#GROUP BY',
          'HAVING',
        ],
        initialValue: '',
        placeholder: "Type '#' to make a reference",
        dividerIndex: 2,
        limit: 4,
      };
    });
  }
}
