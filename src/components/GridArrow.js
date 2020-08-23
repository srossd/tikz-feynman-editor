import {h, Component} from 'preact'
import classNames from 'classnames'
import {arrSubtract, arrEquals, arrScale, arrAdd} from '../helper'
import {
  norm,
  normalize,
  getPerpendicularLeftVector,
  getRectCenteredAround,
  getRectSegmentIntersections
} from '../geometry'
import {svgPathProperties} from 'svg-path-properties'

const lineWidth = 30
const squiggleStep = 10
const squiggleAmplitude = 5
const gluonAmplitude = 10

export default class GridArrow extends Component {
  constructor(props) {
    super()

    this.state = {
      labelX: '50%',
      labelY: 0,
      momentumX: '50%',
      momentumY: 0,
      startPoint: props.from.map(x => x * props.cellSize + props.cellSize / 2),
      endPoint: props.to.map(x => x * props.cellSize + props.cellSize / 2)
    }
  }

  componentDidMount() {
    this.componentWillReceiveProps()
  }

  shouldComponentUpdate(nextProps, nextState) {
    for (let key in nextProps) {
      if (nextProps[key] !== this.props[key]) return true
    }

    for (let key in nextState) {
      if (
        (nextState[key] instanceof Array &&
          !arrEquals(nextState[key], this.state[key])) ||
        (!(nextState[key] instanceof Array) &&
          nextState[key] !== this.state[key])
      )
        return true
    }

    return false
  }

  componentWillReceiveProps(nextProps) {
    if (
      // Conditions on when we don't need to update arrow rendering itself
      nextProps != null &&
      nextProps.from === this.props.from &&
      nextProps.to === this.props.to &&
      nextProps.fromSize === this.props.fromSize &&
      nextProps.toSize === this.props.toSize &&
      nextProps.bend === this.props.bend &&
      nextProps.shift === this.props.shift &&
      nextProps.loop === this.props.loop &&
      nextProps.charge === this.props.charge
    )
      return

    if (nextProps == null) nextProps = this.props

    MathJax.Hub.Queue(() => {
      let {cellSize, fromSize, toSize} = nextProps
      let [fromWidth, fromHeight] = fromSize || [0, 0]
      let [toWidth, toHeight] = toSize || [0, 0]

      ;[toWidth, toHeight] = [toWidth, toHeight].map(x =>
        Math.min(cellSize, x + (toWidth != toHeight ? 20 : 0))
      )
      ;[fromWidth, fromHeight] = [fromWidth, fromHeight].map(x =>
        Math.min(cellSize, x + (fromWidth != fromHeight ? 20 : 0))
      )

      let [fromCenter, toCenter] = [nextProps.from, nextProps.to].map(x =>
        x.map(y => y * cellSize + cellSize / 2)
      )
      let m = arrScale(0.5, arrAdd(fromCenter, toCenter))
      let d = arrSubtract(toCenter, fromCenter)
      let {length} = this.getLengthAngle()

      let controlPoint = arrAdd(
        m,
        arrScale(
          (length * Math.tan((-(nextProps.bend || 0) * Math.PI) / 180)) / 2,
          normalize(getPerpendicularLeftVector(d))
        )
      )

      let fromRect = getRectCenteredAround(fromCenter, fromWidth, fromHeight)
      let toRect = getRectCenteredAround(toCenter, toWidth, toHeight)

      let fromIntersection = getRectSegmentIntersections(
        fromRect,
        fromCenter,
        controlPoint
      )[0]
      let toIntersection = getRectSegmentIntersections(
        toRect,
        controlPoint,
        toCenter
      )[0]

      if (fromWidth == fromHeight)
        fromIntersection = arrAdd(
          fromCenter,
          arrScale(fromWidth / 2, normalize(arrSubtract(toCenter, fromCenter)))
        )
      if (toWidth == toHeight)
        toIntersection = arrAdd(
          toCenter,
          arrScale(toWidth / 2, normalize(arrSubtract(fromCenter, toCenter)))
        )

      this.setState({
        startPoint: fromIntersection || fromCenter,
        endPoint: toIntersection || toCenter
      })
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.valueElement == null && this.momentumElement == null) return

    let {onTypesetFinish = () => {}} = this.props

    for (let el of this.valueElement.querySelectorAll(
      ['span[id^="MathJax"]', '.MathJax_Preview', 'script'].join(', ')
    )) {
      el.remove()
    }
    for (let el of this.momentumElement.querySelectorAll(
      ['span[id^="MathJax"]', '.MathJax_Preview', 'script'].join(', ')
    )) {
      el.remove()
    }

    if (this.props.value) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])
      MathJax.Hub.Queue(() => {
        onTypesetFinish({
          id: this.props.id,
          element: this.valueElement.querySelector('.MathJax_Preview + span')
        })
      })
    } else {
      onTypesetFinish({
        id: this.props.id,
        element: null
      })
    }

    if (this.props.momentum) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.momentumElement])
      MathJax.Hub.Queue(() => {
        onTypesetFinish({
          id: this.props.id,
          element: this.momentumElement.querySelector('.MathJax_Preview + span')
        })
      })
    } else {
      onTypesetFinish({
        id: this.props.id,
        element: null
      })
    }

    MathJax.Hub.Queue(() => {
      if (
        // Conditions on when we don't need to update label positioning
        this.props === prevProps &&
        this.state.startPoint === prevState.startPoint &&
        this.state.endPoint === prevState.endPoint
      )
        return

      if (prevProps == null) prevProps = this.props

      let bbox = this.pathElement.getBBox()
      let mwidth = window.getComputedStyle(this.momentumElement).width
      let mheight = window.getComputedStyle(this.momentumElement).height
      let {width, height} = window.getComputedStyle(this.valueElement)

      ;[width, height] = [width, height].map(parseFloat)
      ;[mwidth, mheight] = [mwidth, mheight].map(parseFloat)

      let labelPosition = this.props.labelPosition || 'left'
      let momentumPosition = this.props.momentumPosition || 'left'

      let angle = this.getLengthAngle().angle
      let newHeight =
        height * Math.abs(Math.cos(angle)) + width * Math.abs(Math.sin(angle))
      let newMHeight =
        mheight * Math.abs(Math.cos(angle)) + mwidth * Math.abs(Math.sin(angle))
      let heightDiff = newHeight - height
      let mheightDiff = newMHeight - mheight + 10
      let labelOffsetX = -width / 2
      let momentumOffsetX = -mwidth / 2

      this.setState({
        labelX: `calc(50% + ${labelOffsetX}px)`,
        labelY: {
          left:
            this.props.bend >= 0
              ? bbox.y - height - heightDiff / 2 - 5
              : bbox.y + bbox.height - height - heightDiff / 2 - 11,
          right:
            this.props.bend > 0
              ? bbox.y + heightDiff / 2 + 11
              : bbox.y + bbox.height + heightDiff / 2 + 5
        }[labelPosition],
        momentumX: `calc(50% + ${momentumOffsetX}px)`,
        momentumY: {
          left:
            this.props.bend >= 0
              ? bbox.y - mheight - mheightDiff / 2 - 5
              : bbox.y + bbox.height - mheight - mheightDiff / 2 - 11,
          right:
            this.props.bend > 0
              ? bbox.y + mheightDiff / 2 + 11
              : bbox.y + bbox.height + mheightDiff / 2 + 5
        }[momentumPosition]
      })
    })
  }

  getLengthAngle() {
    let {startPoint, endPoint} = this.state
    let [dx, dy] = arrSubtract(endPoint, startPoint)

    return {
      length: norm([dx, dy]),
      angle: Math.atan2(dy, dx)
    }
  }

  render() {
    let width,
      height,
      leftOffset,
      topOffset,
      path,
      arrowPath,
      arrowTransform,
      momentumArrowPath,
      momentumArrowHeadTransform,
      degree,
      mx,
      my

    let {startPoint, endPoint} = this.state
    ;[mx, my] = arrScale(0.5, arrAdd(startPoint, endPoint))

    let {length, angle} = this.getLengthAngle()
    degree = (angle * 180) / Math.PI

    let bend = this.props.bend || 0
    let bendAngle = (bend * Math.PI) / 180

    let [cx, cy] = [length / 2, -(length * Math.tan(bendAngle)) / 2]
    ;[width, height] = [length, Math.max(Math.abs(cy) + lineWidth, lineWidth)]
    ;[leftOffset, topOffset] = [-width / 2, 0]

    let leftPoint = [0, height / 2]
    let rightPoint = [length, height / 2]
    let controlPoint = arrAdd(leftPoint, [cx, cy])

    path = `
      M ${leftPoint.join(' ')}
      Q ${controlPoint.join(' ')}
      ${rightPoint.join(' ')}
    `

    let properties = new svgPathProperties(path)

    arrowPath = 'M 10 0 -10 7 -10 -7'
    let midLength = properties.getTotalLength() / 2
    let midPt = properties.getPointAtLength(midLength)
    let midTangent = properties.getTangentAtLength(midLength)
    let midAngle = -Math.atan2(midTangent.y, midTangent.x)
    arrowTransform =
      'translate(' +
      [midPt.x, midPt.y].join(' ') +
      ') rotate (' +
      (midAngle + (this.props.charge === -1 ? 180 : 0)) +
      ')'

    let firstLen = properties.getTotalLength() * 0.15
    let secondLen = properties.getTotalLength() - firstLen
    let firstPt = properties.getPointAtLength(firstLen)
    let secondPt = properties.getPointAtLength(secondLen)
    let firstTangent = properties.getTangentAtLength(firstLen)
    let dist =
      !this.props.momentumPosition || this.props.momentumPosition == 'left'
        ? -10
        : 10
    let momentumArrowStart = arrAdd(
      [firstPt.x, firstPt.y],
      arrScale(dist, normalize([-firstTangent.y, firstTangent.x]))
    )
    let momentumArrowEnd = arrAdd(
      [secondPt.x, secondPt.y],
      arrScale(dist, normalize([firstTangent.y, firstTangent.x]))
    )
    let momentumControlPoint = arrAdd(
      momentumArrowStart,
      arrScale(
        (0.5 * (momentumArrowEnd[0] - momentumArrowStart[0])) / firstTangent.x,
        [firstTangent.x, firstTangent.y]
      )
    )
    momentumArrowPath = `
    M ${momentumArrowStart.join(' ')}
    Q ${momentumControlPoint.join(' ')}
    ${momentumArrowEnd.join(' ')}
  `

    momentumArrowHeadTransform =
      'translate (' +
      arrAdd(
        momentumArrowEnd,
        arrScale(5, normalize([-firstTangent.y, -firstTangent.x]))
      ).join(' ') +
      ') rotate (' +
      (180 / Math.PI) * Math.atan2(-firstTangent.y, firstTangent.x) +
      ')'

    if (['photon', 'gluon'].includes(this.props.line)) {
      var pathLen = properties.getTotalLength()
      var numSteps = Math.round(pathLen / squiggleStep)

      var pos = properties.getPointAtLength(0)
      var newPath = 'M' + [pos.x, pos.y].join(',')
      var side = -1
      for (var i = 1; i <= numSteps; i++) {
        var last = pos
        var pos = properties.getPointAtLength((i * pathLen) / numSteps)

        var vector = {x: pos.x - last.x, y: pos.y - last.y}
        var vectorLen = Math.sqrt(vector.x * vector.x + vector.y * vector.y)

        if (this.props.line == 'photon') {
          var perpVector = {
            x: -(squiggleAmplitude * vector.y) / vectorLen,
            y: (squiggleAmplitude * vector.x) / vectorLen
          }

          var half = {x: last.x + vector.x / 2, y: last.y + vector.y / 2}

          var cp = {
            x: half.x + perpVector.x * side,
            y: half.y + perpVector.y * side
          }
          newPath += 'Q' + [cp.x, cp.y, pos.x, pos.y].join(',')

          side = -side
        } else {
          var perpVector = {
            x: -(gluonAmplitude * vector.y) / vectorLen,
            y: (gluonAmplitude * vector.x) / vectorLen
          }

          var half = {
            x: last.x + vector.x / 2,
            y: last.y + vector.y / 2
          }
          var halfUp = {
            x: last.x + vector.x / 2 + perpVector.x * side,
            y: last.y + vector.y / 2 + perpVector.y * side
          }

          var cp = {
            x: pos.x + perpVector.x * side,
            y: pos.y + perpVector.y * side
          }

          newPath +=
            ' C ' +
            [half.x, half.y, cp.x, cp.y, halfUp.x, halfUp.y].join(',') +
            ' S ' +
            [half.x, half.y, pos.x, pos.y].join(',')
        }
      }
      path = newPath
    }

    return (
      <li
        data-id={this.props.id}
        class={classNames('grid-arrow', {
          selected: this.props.selected,
          phantom: this.props.phantom
        })}
        style={{
          height,
          width,
          left: mx + leftOffset,
          top: my - height / 2 + topOffset,
          transform: `rotate(${degree}deg)`
        }}
        onClick={this.props.onClick}
      >
        <svg ref={el => (this.svgElement = el)} width={width} height={height}>
          <path
            class="mouse"
            fill="none"
            stroke-width="12"
            stroke="transparent"
            stroke-linecap="square"
            d={path}
          />

          <g ref={el => (this.pathElement = el)} fill="none">
            <path
              d={path}
              stroke={this.props.line === 'none' ? 'transparent' : 'black'}
              stroke-width={2}
              stroke-dasharray={
                {
                  scalar: '7, 3'
                }[this.props.line]
              }
            />
          </g>

          <path
            fill={
              this.props.charge == 0 || typeof this.props.charge === 'undefined'
                ? 'transparent'
                : 'black'
            }
            d={arrowPath}
            transform={arrowTransform}
          />

          {this.props.momentum ? (
            <g>
              <path
                d={momentumArrowPath}
                stroke="black"
                stroke-width={1}
                fill="transparent"
              />
              <image
                x={0}
                y={0}
                width={10}
                height={10}
                transform={momentumArrowHeadTransform}
                xlinkHref={`./img/arrow/default.svg`}
              />
            </g>
          ) : null}
        </svg>

        <div
          ref={el => (this.valueElement = el)}
          class={classNames('value', this.props.labelPosition)}
          style={{
            left: this.state.labelX,
            top: this.state.labelY,
            transform: `rotate(${-degree}deg)`
          }}
        >
          {this.props.value ? (
            `\\(${this.props.value}\\)`
          ) : (
            <span class="hide">_</span>
          )}
        </div>

        <div
          ref={el => (this.momentumElement = el)}
          class={classNames('momentum', this.props.momentumPosition)}
          style={{
            left: this.state.momentumX,
            top: this.state.momentumY,
            transform: `rotate(${-degree}deg)`
          }}
        >
          {this.props.momentum ? (
            `\\(${this.props.momentum}\\)`
          ) : (
            <span class="hide">_</span>
          )}
        </div>
      </li>
    )
  }
}
