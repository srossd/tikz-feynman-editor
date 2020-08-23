import {h, Fragment, Component} from 'preact'
import classNames from 'classnames'
import {clamp} from '../helper'

import Toolbox, {Button, Separator} from './Toolbox'

export default class NodeProperties extends Component {
  constructor() {
    super()

    this.state = {}
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.data !== this.props.data || nextProps.show !== this.props.show
    )
  }

  handleButtonClick = id => {
    if (this.buttonClickHandlersCache == null)
      this.buttonClickHandlersCache = {}

    if (this.buttonClickHandlersCache[id] == null) {
      this.buttonClickHandlersCache[id] = evt => {
        let {data = {}, onChange = () => {}} = this.props
        let change = {vertex: data.vertex && data.vertex == id ? '' : id}

        onChange({
          position: this.props.nodePosition,
          data: {...data, ...change}
        })
      }
    }

    return this.buttonClickHandlersCache[id]
  }

  render() {
    let data = this.props.data == null ? {} : this.props.data

    return (
      <section
        id="properties"
        class={classNames({
          show: this.props.show,
          edit: this.state.edit
        })}
      >
        <Toolbox>
          <Button
            checked={data.vertex === 'dot'}
            icon="./img/vertices/dot.svg"
            name="Dot"
            onClick={this.handleButtonClick('dot')}
          />

          <Button
            checked={data.vertex === 'square_dot'}
            icon="./img/vertices/square_dot.svg"
            name="Square Dot"
            onClick={this.handleButtonClick('square_dot')}
          />

          <Button
            checked={data.vertex === 'empty_dot'}
            icon="./img/vertices/empty_dot.svg"
            name="Empty Dot"
            onClick={this.handleButtonClick('empty_dot')}
          />

          <Button
            checked={data.vertex === 'crossed_dot'}
            icon="./img/vertices/crossed_dot.svg"
            name="Crossed Dot"
            onClick={this.handleButtonClick('crossed_dot')}
          />

          <Button
            checked={data.vertex === 'blob'}
            icon="./img/vertices/blob.svg"
            name="Blob"
            onClick={this.handleButtonClick('blob')}
          />
        </Toolbox>
      </section>
    )
  }
}
