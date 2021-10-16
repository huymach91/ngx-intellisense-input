import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  Input,
  ViewChildren,
  Output,
  EventEmitter,
  HostListener,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';

declare var document: any;

export enum INTELLISENSE_INPUT_TYPE {
  SINGLE = 1,
  MULTIPLE = 2,
}

export interface IIntellisenseInputConfig {
  type: INTELLISENSE_INPUT_TYPE;
  references: Array<string>;
  initialValue: string;
  placeholder: string;
  limit: number;
  dividerIndex: number; // divider index starts from 0
}

interface ICaret {
  caretPosition: number;
  caretNode: HTMLElement;
  rect: DOMRect;
  valid: boolean;
}

@Component({
  selector: 'intellisense-input',
  templateUrl: './intellisense-input.component.html',
  styleUrls: ['./intellisense-input.component.scss'],
})
export class IntellisenseInputComponent implements OnInit, AfterViewChecked {
  @Input('config') set setConfig(value: IIntellisenseInputConfig) {
    if (!value) return;
    this.config = value;
    if (!value.initialValue) {
      return; // stop here when initial value is empty
    }
    // highlight reference word and break lines
    this.config.initialValue = this.highlightReference(value.initialValue);
    if (this.config.type === INTELLISENSE_INPUT_TYPE.MULTIPLE) {
      this.config.initialValue = this.breaklines(this.config.initialValue);
    }
  }

  @Output() onChange = new EventEmitter();

  public config: IIntellisenseInputConfig = {
    type: INTELLISENSE_INPUT_TYPE.SINGLE,
    references: [],
    initialValue: '',
    placeholder: "Type '#' to make a reference",
    limit: 3,
    dividerIndex: 2,
  };

  public references = [];
  public filteredReference = [];
  public referenceLimit = 4;
  public isStartWithHashSymbol: boolean;
  private caretStart: number = null;
  private nodeStart: HTMLElement;
  private caretEnd: number = null;
  private nodeEnd: HTMLElement;
  private currentKeyword: string; // store the keyword after '#'
  public currentActiveIndex: number = -1; // currentActiveIndex is the current active item index when user types arrow up or down.
  public showPlaceHolder: boolean;

  public contentStyle = {};
  public dropdownStyle = {
    display: 'none',
    height: '30px',
    'overflow-y': '',
    'white-space': 'nowrap',
  };
  private error = {};
  // public formulaError = null;

  @ViewChildren('referenceItem') referenceItems: QueryList<ElementRef>;
  @ViewChild('IntellisenseInputWrapperRef')
  IntellisenseInputWrapperRef: ElementRef;
  @ViewChild('IntellisenseInputRef', { static: false })
  IntellisenseInputRef: ElementRef;
  @ViewChild('dropdownMenuRef', { static: false }) dropdownMenuRef: ElementRef;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.config.type === INTELLISENSE_INPUT_TYPE.MULTIPLE) {
      this.contentStyle = {
        'white-space': '',
        'min-height': '60px',
      };
    }
  }

  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: any) {
    // this HostListener will be cancel when route changes
    const IntellisenseInputWrapperElement = this.IntellisenseInputWrapperRef
      .nativeElement as HTMLDivElement;
    if (
      !IntellisenseInputWrapperElement.contains(event.target) &&
      this.dropdownStyle.display === 'block'
    ) {
      this.onCloseReferenceDropdown();
    }
  }

  public onKeydown(event: KeyboardEvent) {
    if (event.key === ' ') {
      this.onCloseReferenceDropdown();
    }

    if (event.key === '#') {
      // *** start event ***
      // the event start from here when user types '#'
      const caret = this.getCaret(event.target);
      if (caret.valid) {
        this.caretStart = caret.caretPosition;
        this.nodeStart = caret.caretNode;
        this.caretEnd = this.caretStart;
        this.nodeEnd = this.nodeStart;

        this.isStartWithHashSymbol = true;
        this.currentActiveIndex = 0;

        this.onOpenReferenceDropdown();
      }
    }

    if (
      this.isStartWithHashSymbol &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      this.onCloseReferenceDropdown();
    }

    if (this.isStartWithHashSymbol && event.key === 'ArrowUp') {
      this.currentActiveIndex =
        this.currentActiveIndex === 0
          ? this.referenceItems.length - 1
          : this.currentActiveIndex - 1;
      this.updateDropdownMenuScrollTop();
      return false;
    }

    if (this.isStartWithHashSymbol && event.key === 'ArrowDown') {
      this.currentActiveIndex =
        this.currentActiveIndex === this.referenceItems.length - 1
          ? 0
          : this.currentActiveIndex + 1;
      this.updateDropdownMenuScrollTop();
      return false;
    }

    if (
      (this.isStartWithHashSymbol && event.key === 'Enter') ||
      (!this.isStartWithHashSymbol &&
        event.key === 'Enter' &&
        this.config.type === INTELLISENSE_INPUT_TYPE.SINGLE)
    ) {
      return false;
    }

    if (event.key === 'Backspace') {
      const caret = this.getCaret(event.target);
      this.customBackSpace(caret);
      this.emitChanges();
      setTimeout(() => {
        this.cleanUpContent();
      }, 30);
    }

    if (
      event.key === 'Enter' &&
      this.config.type === INTELLISENSE_INPUT_TYPE.MULTIPLE
    ) {
      const caret = this.getCaret(event.target);
      this.customBreakLine(caret);
      setTimeout(() => {
        this.cleanUpContent();
      }, 50);
    }
  }

  public onKeyup(event: KeyboardEvent) {
    // emit changes
    this.emitChanges();
    if (!this.isStartWithHashSymbol) return;
    const caret = this.getCaret(event.target);
    this.nodeEnd = caret.caretNode;
    this.caretEnd = caret.caretPosition;
    const keyword = this.nodeEnd
      ? this.nodeEnd.textContent.substring(this.caretStart, this.caretEnd)
      : '';
    if (!keyword) {
      this.onCloseReferenceDropdown();
      return;
    }
    this.currentKeyword = keyword;
    this.filteredReference = this.config.references.filter((f) =>
      f.toLowerCase().includes(keyword.toLowerCase())
    );
    this.calcDropdownHeight();
    // set coordinate for dropdown menu
    this.setDropdownMenuCoordinate(caret.rect);
  }

  public onEnter() {
    // 'enter' accepts when user's typo starts with '#', reference list found at least one.
    if (
      !this.isStartWithHashSymbol ||
      this.currentActiveIndex === -1 ||
      !this.filteredReference.length
    ) {
      return;
    }
    this.onSelectReference(this.filteredReference[this.currentActiveIndex]);
  }

  public onBlur(event: any) {
    const IntellisenseInputElement = this.IntellisenseInputRef
      .nativeElement as HTMLDivElement;
    this.emitChanges();
  }

  public onPaste(event: any) {
    const clipboardData = event.clipboardData;
    const pastedData = clipboardData.getData('Text');
    if (this.config.references.indexOf(pastedData) !== -1) {
      this.customPaste(this.createNode(pastedData));
    } else {
      const textNode = document.createTextNode(pastedData);
      this.customPaste(textNode);
    }
    event.preventDefault();
    return false;
  }

  public onSelectReference(reference: string) {
    const IntellisenseInputElement = this.IntellisenseInputRef
      .nativeElement as HTMLDivElement;
    const referenceElement = this.createNode(reference);
    const nodeStart = this.nodeStart || IntellisenseInputElement.firstChild;
    this.insertNode(nodeStart, this.caretStart, referenceElement);

    setTimeout(() => {
      this.removeSelectionAt(
        referenceElement.nextSibling,
        0,
        this.currentKeyword.length
      );
      setTimeout(() => {
        const textNode = document.createTextNode('\u00A0');
        this.insertNode(referenceElement.nextSibling, 0, textNode);
        this.setCaret(textNode, 1);
      });
      this.emitChanges();
    });
    // *** end event ***
    this.reset();
  }

  private createNode(nodeValue: string): HTMLSpanElement {
    const node = document.createElement('span');
    node.innerText = nodeValue;
    node.setAttribute('contenteditable', 'false');
    node.style.setProperty('color', 'blue');
    node.setAttribute('class', 'highlighted');
    node.onclick = (event: any) => {
      this.setCaret(event.target.firstChild, 0);
    };
    return node;
  }

  private insertNode(parent: any, startOffset: number, node: any) {
    const range = document.createRange();
    range.setStart(parent, startOffset);
    range.collapse(true);
    range.deleteContents();
    range.insertNode(node);
  }

  public onOpenReferenceDropdown() {
    this.isStartWithHashSymbol = true;
    this.dropdownStyle.display = 'block';
    this.calcDropdownHeight();
    this.updateDropdownMenuScrollTop();
  }

  public onCloseReferenceDropdown() {
    this.isStartWithHashSymbol = false;
    this.dropdownStyle.display = 'none';
    this.currentActiveIndex = -1;
  }

  public calcDropdownHeight() {
    if (this.filteredReference.length > this.config.limit) {
      this.dropdownStyle['overflow-y'] = 'auto';
    }
    const padding = this.filteredReference.length ? 10 : 0;
    this.dropdownStyle.height =
      Math.max(
        30,
        Math.min(this.filteredReference.length, this.config.limit) * 28
      ) +
      padding +
      'px';
  }

  public updateDropdownMenuScrollTop() {
    if (
      this.currentActiveIndex === -1 ||
      !this.dropdownMenuRef ||
      !this.dropdownMenuRef.nativeElement ||
      !this.referenceItems.length
    )
      return;
    const activeItem = this.referenceItems.toArray()[this.currentActiveIndex]
      .nativeElement as HTMLDivElement;
    const dropdownMenu = this.dropdownMenuRef.nativeElement as HTMLDivElement;
    dropdownMenu.scrollTop = activeItem.offsetTop - activeItem.offsetHeight;
  }

  public setDropdownMenuCoordinate(rect: DOMRect) {
    if (!rect || !this.dropdownMenuRef) return;
    const dropdownMenuElement = this.dropdownMenuRef
      .nativeElement as HTMLDivElement;
    dropdownMenuElement.style.setProperty(
      'left',
      rect.left + rect.width + 'px'
    );
    dropdownMenuElement.style.setProperty('top', rect.top + 'px');
  }

  private removeSelectionAt(node: any, offsetStart: number, offsetEnd: number) {
    const range = document.createRange();
    range.setStart(node, offsetStart);
    range.setEnd(node, offsetEnd);
    range.deleteContents();
  }

  private getCaret(editableDiv): ICaret {
    let caretPos = 0,
      caretNode,
      sel,
      rect,
      range,
      valid;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount) {
        range = sel.getRangeAt(0);
        // case 1:
        // '|' is caret
        // 1.A caret focuses at first node, ex: [|]
        // 1.B caret focuses at contenteditable=false, ex: [#SELECT| ]
        if (editableDiv === range.commonAncestorContainer) {
          valid = true;
          caretNode =
            range.endOffset > 0
              ? range.commonAncestorContainer.childNodes.item(
                  range.endOffset - 1
                )
              : range.commonAncestorContainer;
          if (
            caretNode &&
            caretNode.previousElementSibling &&
            caretNode.previousElementSibling &&
            caretNode.previousElementSibling.hasAttribute('contenteditable')
          ) {
            valid = false;
          } else {
            caretPos = range.endOffset;
            rect = range.getClientRects()[0];
          }
        } else if (
          editableDiv.contains(range.commonAncestorContainer.parentNode)
        ) {
          // case 2: caret focuses at '#', ex: '|#'
          caretNode = range.commonAncestorContainer;
          caretPos = range.endOffset;
          rect = range.getClientRects()[0];
          valid = true;
        } else {
        }
      }
    }
    return {
      caretPosition: caretPos,
      caretNode: caretNode,
      rect: rect,
      valid: valid,
    };
  }

  private setCaret(node: Node, startOffset: number) {
    const range = document.createRange();
    range.setStart(node, startOffset);
    range.setEnd(node, startOffset);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(range);
  }

  private highlightReference(value: string) {
    if (!this.config.references.length) return value;
    return value.replace(
      new RegExp(this.config.references.join('|'), 'ig'),
      (reference: string) => {
        return (
          '<span class="highlighted" oncopy="return false;" contenteditable="false" style="color: blue;">' +
          reference +
          '</span>'
        );
      }
    );
  }

  private breaklines(value: string) {
    const lines = value.split('\n');
    if (!lines.length) return;
    const newLines = [...lines.splice(0, 1)];
    lines.forEach((line) => {
      newLines.push('<div>' + line + '</div>');
    });
    return newLines.join('');
  }

  public emitChanges() {
    const IntellisenseInputRef = this.IntellisenseInputRef
      .nativeElement as HTMLDivElement;
    const highlighted = IntellisenseInputRef.querySelectorAll('.highlighted');
    const selectedReferences = [];
    highlighted.forEach((item) => {
      selectedReferences.push(item.textContent);
    });
    this.onChange.emit({
      value: IntellisenseInputRef.innerText,
      selectedReferences,
    });
  }

  public reset() {
    this.isStartWithHashSymbol = false;
    this.caretStart = null;
    this.caretEnd = null;
    this.nodeStart = null;
    this.nodeEnd = null;
    this.currentActiveIndex = -1;
    this.dropdownStyle.display = 'none';
  }

  public onClickPlaceHolder() {
    const IntellisenseInputRef = this.IntellisenseInputRef
      .nativeElement as HTMLDivElement;
    IntellisenseInputRef.focus();
  }

  public customPaste(node: Node) {
    if (window.getSelection) {
      // all browsers, except IE before version 9
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        // insert
        const range = selection.getRangeAt(0);
        range.insertNode(node);
        // clear current range
        document.getSelection().removeAllRanges();
        // focus to new
        setTimeout(() => {
          const otherRange = document.createRange();
          otherRange.setStart(node.nextSibling, 0);
          otherRange.collapse();
          window.getSelection().addRange(otherRange);
        });
      }
    }
  }

  private removeBreakLine(caret: ICaret) {
    const textNode = document.createTextNode('\u00A0');
    this.insertNode(caret.caretNode, 0, textNode);
    setTimeout(() => {
      const selection = window.getSelection();
      const focusNode = selection.focusNode;
      // case 1: focus on whitespace
      if (focusNode.nodeType === 3 && focusNode.nodeValue.trim() === '') {
        this.removeSelectionAt(selection.anchorNode, 0, 0);
      }
      // case 2: span or div has only one BR is a child
      if (
        (focusNode.nodeName === 'SPAN' || focusNode.nodeName === 'DIV') &&
        focusNode.childNodes.length === 1 &&
        focusNode.firstChild.nodeName === 'BR'
      ) {
        this.removeSelectionAt(focusNode, 0, 0);
      }

      this.cleanUpContent();
    });
  }

  private cleanUpContent() {
    const IntellisenseInputElement = this.IntellisenseInputRef
      .nativeElement as HTMLDivElement;
    const divElements = IntellisenseInputElement.querySelectorAll('div');
    // case 1: a div with no childNodes
    if (divElements.length) {
      divElements.forEach((divElement) => {
        if (!divElement.childNodes.length) {
          divElement.remove();
        }
      });
    }
    // case 2: span 0.9em, whitespace
    const spanElements = IntellisenseInputElement.querySelectorAll('span');
    spanElements.forEach((span) => {
      // case 2.1: remove span with font-size: 0.9em and whitespace childNodes
      if (
        span.style &&
        span.style[0] === 'font-size' &&
        span.innerText.trim() === '' &&
        /\w/.test(span.nodeValue)
      ) {
        span.remove();
      }
      // case 2.2: remove span with font-size: 0.9em
      if (span.className.includes('highlighted')) {
        span.style.removeProperty('font-size');
      }
      // case 2.3: update click for span
      if (span.className.includes('highlighted')) {
        span.onclick = (event: any) => {
          this.setCaret(event.target.firstChild, 0);
        };
      }
    });
  }

  private addWhiteSpaceNode(parent: Node, beforeNode) {
    const textNode = document.createTextNode('\u00A0');
    console.log(textNode);
    parent.insertBefore(textNode, beforeNode);
  }

  private customBreakLine(caret: ICaret) {
    console.log(caret);
    if (!caret.caretPosition && !caret.caretNode) return;
    setTimeout(() => {
      const selection = window.getSelection();
      const nextElementSibling = selection.focusNode;

      if (
        nextElementSibling.nodeValue &&
        nextElementSibling.nodeValue.trim() === '' &&
        nextElementSibling.nodeType === 3
      ) {
        return;
      }
      // case 1: caret at first of line
      // ex: [| ]
      if (
        nextElementSibling &&
        nextElementSibling.childNodes.length > 1 &&
        nextElementSibling.nodeName === 'DIV'
      ) {
        // caret at whitespace not in a span
        const firstChild = nextElementSibling?.firstChild;
        if (!firstChild) return;

        if (firstChild.nodeName === 'BR') {
          firstChild.remove();
        }

        return;
      }
      // case 2: caret at text empty value
      // ex: [#SELECT * |#FROM tblUser]
      if (
        caret.caretNode.nodeValue &&
        caret.caretNode.nodeValue.trim() === '' &&
        caret.caretNode.nodeType === 3
      ) {
        // caret at whitespace in a spacing
        const span = caret.caretNode.parentNode || caret.caretNode;
        const divSibling = span?.nextSibling;

        if (!divSibling || !divSibling.firstChild) return;

        divSibling.firstChild.remove();
        return;
      }
    });

    // case 3: caret at contenteditable=false,
    // note: | is caret
    // caretPosition = 0
    if (
      caret.caretNode.nodeValue &&
      caret.caretNode.nodeName === '#text' &&
      caret.caretNode.nodeType === 3 &&
      caret.caretNode.parentElement.hasAttribute('contenteditable') &&
      caret.caretPosition === 0
    ) {
      const highlighedElement = caret.caretNode.parentElement;
      // case 3.1: if previous node is #text
      // ex: [#SELECT * <span contentEditable="false">|#FROM</span> tblUser]
      // in this case, previous element is ' * '
      if (
        highlighedElement.previousSibling &&
        highlighedElement.previousSibling.nodeName === '#text'
      ) {
        this.setCaret(
          highlighedElement.previousSibling,
          highlighedElement.previousSibling.nodeValue.length
        );
      }
      // case 3.2: if previous node is null, then parent must be a div (a line)
      // ex: [#SELECT * <span class="highlighted">|#FROM</span>]
      if (
        !highlighedElement.previousSibling &&
        highlighedElement.parentElement.nodeName === 'DIV'
      ) {
        this.setCaret(highlighedElement.parentElement, 0);
      }
      // case 3.3: if previous node is null, then parent must be a span (highlighted)
      if (
        highlighedElement &&
        highlighedElement.nodeName === 'SPAN' &&
        highlighedElement.className.includes('highlighted') &&
        highlighedElement.previousSibling
      ) {
        this.setCaret(
          highlighedElement.previousSibling,
          highlighedElement.previousSibling.nodeValue
            ? highlighedElement.previousSibling.nodeValue.length - 1
            : 0
        );
      }
    }
  }

  private customBackSpace(caret: ICaret) {
    const caretNode = caret.caretNode;
    // case 1: focus on div
    if (
      caretNode &&
      caretNode.nodeName === 'DIV' &&
      caretNode.childNodes.length
    ) {
      // it's first child must be contenteditable=false
      const firstChild = caretNode.firstChild as HTMLSpanElement;
      const isContentEditable = firstChild.hasAttribute('contenteditable');
      if (isContentEditable) {
        this.addWhiteSpaceNode(caretNode, firstChild);
      }
    }
    // caes 2: caret on span with contenteditable=false, ex: [ #SELECT * \n|#FROM ]
    // note: '|' is caret
    if (
      caretNode &&
      caretNode.nodeName === 'SPAN' &&
      caretNode.hasAttribute('contenteditable')
    ) {
      this.addWhiteSpaceNode(caretNode.parentNode, caretNode);
    }
    // case 3: caret at div with only br as child
    // example:
    // [
    //  |
    //  #SELECT * #FROM tblUser
    // ]
    if (
      caretNode &&
      caretNode.nodeName === 'DIV' &&
      caretNode.childNodes.length === 1 &&
      caretNode.firstChild.nodeName === 'BR'
    ) {
      caretNode.remove();
    }
    // case 4: caret at .intellisense-input-content.div
    if (caretNode && caretNode === this.IntellisenseInputRef.nativeElement) {
      const firstChild = caretNode.firstChild as HTMLDivElement;
      const grandChild = firstChild.firstChild as HTMLBRElement;
      if (
        firstChild.nodeName === 'DIV' &&
        firstChild.childNodes.length === 1 &&
        grandChild &&
        grandChild.nodeName === 'BR'
      ) {
        firstChild.remove();
      }
    }

    // case 5:
    console.log('case 5', caretNode);
  }
}
