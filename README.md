# Intellisense Input

Angular version 12.1.0. [Buy Me a Coffee](https://www.buymeacoffee.com/huymax)

## Demo

[Stackblitz](https://stackblitz.com/edit/hm-angular-intellisense-input)

## Input Configuration

| Parameter    | Data Type               | Note                                                                 |
| ------------ | ----------------------- | -------------------------------------------------------------------- |
| type         | INTELLISENSE_INPUT_TYPE | SINGLE or MULTIPLE                                                   |
| references   | Array<string>           | array item starts with '#', example: ['#TOTAL', 'SUBTOTAL', 'UNITS'] |
| placeholder  | string                  | 'Type '#' to make a reference'                                       |
| dividerIndex | number                  | divider index starts from 0                                          |
| limit        | number                  |                                                                      |

| Event    | Output                                                     |
| -------- | ---------------------------------------------------------- |
| onChange | data: ❴ value: string, selectedReferences: Array<string> ❵ |

## Features

- Single line

- Mutiple line

## Screenshots

![App Screenshot](https://raw.githubusercontent.com/huymach91/ngx-intellisense-input/master/src/pictures/single-line.png)

![App Screenshot](https://raw.githubusercontent.com/huymach91/ngx-intellisense-input/master/src/pictures/multiple-line-2.png)

## Browser Support

Latest Chrome.
