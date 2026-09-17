import * as vscode from 'vscode';
import { findNestedJsonStringsRaw, findStringValuesRaw, type SourceKind } from './core/jsonUtils';

export type NestedJsonHit = {
  range: vscode.Range;
  parsedText: string;
  keyPath: string;
  sourceKind: SourceKind;
};

export type StringValueHit = {
  range: vscode.Range;
  keyPath: string;
  rawValue: string;
  parsedText?: string;
  sourceKind: SourceKind;
};

export function findNestedJsonStrings(document: vscode.TextDocument): NestedJsonHit[] {
  const raw = findNestedJsonStringsRaw(document.getText());
  return raw.map((hit) => ({
    range: new vscode.Range(
      document.positionAt(hit.offset),
      document.positionAt(hit.offset + hit.length),
    ),
    parsedText: hit.parsedText,
    keyPath: hit.keyPath,
    sourceKind: hit.sourceKind,
  }));
}

export function findStringValues(document: vscode.TextDocument): StringValueHit[] {
  const raw = findStringValuesRaw(document.getText());
  return raw.map((hit) => ({
    range: new vscode.Range(
      document.positionAt(hit.offset),
      document.positionAt(hit.offset + hit.length),
    ),
    keyPath: hit.keyPath,
    rawValue: hit.rawValue,
    parsedText: hit.parsedText,
    sourceKind: hit.sourceKind,
  }));
}
