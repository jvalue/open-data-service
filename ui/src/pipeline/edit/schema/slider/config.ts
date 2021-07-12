const sliderData = [
  {
    name: '1'
  }, {
    name: '2'
  }, {
    name: '4'
  }, {
    name: '8'
  }, {
    name: '16'
  }, {
    name: '32'
  }, {
    name: '64'
  }
]

const options = {
  dotSize: 14,
  width: 500,
  height: 6,
  contained: false,
  direction: 'ltr',
  dataLabel: 'label',
  dataValue: 'sliderValue',
  min: 0,
  max: 100,
  interval: 1,
  disabled: false,
  clickable: true,
  duration: 0.5,
  adsorb: false,
  lazy: false,
  tooltip: 'none',
  tooltipPlacement: 'top',
  tooltipFormatter: 0,
  useKeyboard: false,
  keydownHook: null,
  dragOnClick: false,
  enableCross: true,
  fixed: false,
  minRange: 0,
  maxRange: 0,
  order: true,
  marks: false,
  dotOptions: 0,
  dotAttrs: 0,
  process: true,
  dotStyle: 0,
  railStyle: 0,
  processStyle: 0,
  tooltipStyle: 0,
  stepStyle: 0,
  stepActiveStyle: 0,
  labelStyle: 0,
  labelActiveStyle: 0
}

export const SliderConfig = { sliderData: sliderData, options: options }
