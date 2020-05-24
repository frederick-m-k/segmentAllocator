import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

/**
 * 
 */
@Component({
  selector: 'app-parse-files',
  templateUrl: './parse-files.component.html',
  styleUrls: ['./parse-files.component.css']
})
export class ParseFilesComponent implements OnInit {

  @Input() private type: string;
  @Input() private content: string;
  @Input() private firstLayer: string;
  @Input() private secondLayer: string;

  private foundFirst:boolean;
  private foundSecond:boolean;

  dataStructure:Map<string, Array<Array<number | string>>> = new Map();

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    let counter = 0;
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        if (!changes[propName].isFirstChange()) {
          switch (propName) {
            case 'type':
            case 'content':
            case 'firstLayer':
            case 'secondLayer':
              counter++;
              break;
          }
        }
      }
    }

    if (counter == 4) {
      this.parseFile();
    } else {
      counter = 0;
    }
  }

  private parseFile = () => {
    if (this.type === "TextGrid") {
      this.parseTextGrid();
    } else {
      // Write to logfile
    }
  }

  /**
   * Parse text grid of parse files component
   */
  private parseTextGrid = () => {
    let amountOfTiers:number;
    let pointTier:boolean = null;
    let watchForNextSegment:boolean = false;

    let lines = this.content.split('\n');

    if (lines[0].includes("ooTextFile")) {
      for (let first = 1; first < lines.length; first ++) {
        // First there is some metadata ...
        if ( lines[first].startsWith("size =")) {
          amountOfTiers = parseInt( lines[first].split("=")[1].toString().trim() );
          if (isNaN(amountOfTiers) || amountOfTiers == null) {
            amountOfTiers = 0;
          }
        }
        // ...then the actual data comes through
        if ( lines[first].includes("item []:") ) {
          let startPoint:number;
          let endPoint:number;
          let label:string;
          tier: for (let tier = 1; tier <= amountOfTiers; tier ++) { // search for tier data as often as amountOfTiers
            let layerOnThisRun:number = 0;
            let borderInformation:number = 0;
            if (lines[first + 1].includes("item [" + tier + "]:")) {
              for (let second = first + 2; second < lines.length; second ++) {
                // Read some metadata first ...
                if (lines[second].includes("class = ") && !watchForNextSegment) { // Just to make sure, the metadata is not written in the labels
                  // Only works for Interval tiers so far
                  if (lines[second].includes("IntervalTier")) {
                    pointTier = false;
                  }
                } else if (lines[second].includes("name = ") && !watchForNextSegment) { // Check if the tier is relevant
                  if (lines[second].includes(this.firstLayer)) {
                    this.dataStructure.set(this.firstLayer, new Array());
                    this.foundFirst = true;
                    layerOnThisRun = 1;
                  } else if (lines[second].includes(this.secondLayer)) {
                    this.dataStructure.set(this.secondLayer, new Array());
                    this.foundSecond = true;
                    layerOnThisRun = 2;
                  } else {
                    continue tier;
                  }
                } else if (lines[second].includes("intervals [") && !watchForNextSegment) { // Start searching for the actual data
                  watchForNextSegment = true;
                  borderInformation = 0;
                } else if (lines[second].includes("item [") && !watchForNextSegment) {  // Cycle is done
                  first = second - 1;
                  break;
                }
                // ...and the the actual data
                if (watchForNextSegment) {
                  if (!pointTier) {
                    if (lines[second].includes("xmin =")) {
                      startPoint = parseFloat(lines[second].split("=")[1].toString().trim());
                      borderInformation++;
                      if (isNaN(startPoint) || startPoint == null) { // Reset
                        watchForNextSegment = false;
                        borderInformation = 0;
                        // Write to logfile
                        console.log("parseFloat didn't work");
                        console.log(startPoint);
                      }
                    } else if (lines[second].includes("xmax =")) {
                      endPoint = parseFloat(lines[second].split("=")[1].toString().trim());
                      borderInformation++;
                      if (isNaN(endPoint) || endPoint == null) {  // Reset
                        watchForNextSegment = false;
                        borderInformation = 0;
                        // Write to logfile
                        console.log("parseFloat didn't work");
                        console.log(endPoint);
                      }
                    } else if (lines[second].includes("text =")) {
                      label = lines[second].split("=")[1].toString();
                      borderInformation++;
                      if (label == null) {  // Reset
                        watchForNextSegment = false;
                        borderInformation = 0;
                        // Write to logfile
                        console.log(lines[second] + " should contain the label");
                        console.log(label);
                      }
                    }
                  } else {
                    // Found a point tier
                  }
                  if (borderInformation == 3) {
                    watchForNextSegment = false;
                    if (layerOnThisRun === 1) {
                      this.dataStructure.get(this.firstLayer).push([startPoint, endPoint, label]);
                    } else if (layerOnThisRun === 2) {
                      this.dataStructure.get(this.secondLayer).push([startPoint, endPoint, label]);
                    }
                  }
                }

              }
            } else {
              console.log("Something went wrong!")
              console.log(lines[first + 1] + " should be item [" + tier + "]:");
            }
          }
          break;
        }
      }
    }
  }


}
