# Intellisense Input

Angular version 12.1.0

## Demo

[Stackblitz](https://hm-angular-intellisense-input.stackblitz.io)

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

![App Screenshot](https://raw.githubusercontent.com/huymach91/hm-angular-intellisense-input/master/src/pictures/single-line.png?token=AHXRERJEZXEUN5FDS7PDJVDBNLL5I)

![App Screenshot](https://raw.githubusercontent.com/huymach91/hm-angular-intellisense-input/master/src/pictures/multiple-line.png?token=AHXRERPYFJKPTJNQ2WYEHR3BNLMDG)

## Browser Support

Latest Chrome.
