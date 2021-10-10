import { Component, OnInit } from '@angular/core';
import {
  IIntellisenseInputConfig,
  QUERY_TEXT_INPUT_TYPE,
} from './intellisense-input.component';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public intelisenseInputSingleConfig: IIntellisenseInputConfig;
  public intelisenseInputMultipleConfig: IIntellisenseInputConfig;

  constructor() {}

  public onChangeQueryText(value: string) {
    // console.log(value);
  }

  ngOnInit() {
    this.loadReferencesFromApi();
  }

  public loadReferencesFromApi() {
    setTimeout(() => {
      this.intelisenseInputSingleConfig = {
        type: QUERY_TEXT_INPUT_TYPE.SINGLE,
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

      this.intelisenseInputMultipleConfig = {
        type: QUERY_TEXT_INPUT_TYPE.MULTIPLE,
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
