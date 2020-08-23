import {h, Fragment, Component} from 'preact'
import classNames from 'classnames'
import {clamp} from '../helper'

import Toolbox, {Button, Separator} from './Toolbox'

export default class Properties extends Component {
  constructor() {
    super()

    this.state = {
      edit: false,
      editTop: 0,
      editLeft: 0,
      editMomentum: false,
      editMomentumTop: 0,
      editMomentumLeft: 0
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', evt => {
      if (evt.ctrlKey || evt.metaKey || !this.props.show || this.state.edit)
        return

      let edgeEdit = 'Enter'
      let edgeDelete = ['Delete', 'Backspace']
      let edgeControl = {
        ArrowUp: 'bendleft',
        ArrowDown: 'bendright',
        a: 'labelleft',
        d: 'labelright'
      }

      if (edgeControl[evt.key] != null) {
        evt.preventDefault()

        this.handleButtonClick(edgeControl[evt.key])()
      } else if (edgeDelete.includes(evt.key)) {
        evt.preventDefault()

        let {onRemoveClick = () => {}} = this.props
        onRemoveClick(evt)
      } else if (evt.key == edgeEdit) {
        evt.preventDefault()

        this.handleEditButtonClick()
      }
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.show !== this.props.show ||
      nextProps.data !== this.props.data ||
      nextState.edit !== this.state.edit ||
      nextState.editTop !== this.state.editTop ||
      nextState.editLeft !== this.state.editLeft ||
      nextState.editMomentum !== this.state.editMomentum ||
      nextState.editMomentumTop !== this.state.editMomentumTop ||
      nextState.editMomentumLeft !== this.state.editMomentumLeft
    )
  }

  componentDidUpdate(_, prevState) {
    if (!prevState.edit && this.state.edit) {
      this.inputElement.select()
    } else if (prevState.edit && !this.state.edit) {
      this.inputElement.blur()
    }

    if (!prevState.editMomentum && this.state.editMomentum) {
      this.momentumInputElement.select()
    } else if (prevState.editMomentum && !this.state.editMomentum) {
      this.momentumInputElement.blur()
    }
  }

  updateEditPosition() {
    let valueElement = document.querySelector(
      `.grid-arrow[data-id="${this.props.edgeId}"] .value`
    )
    let {left, top, width} = valueElement.getBoundingClientRect()
    let {width: editWidth, height: editHeight} = window.getComputedStyle(
      this.editElement
    )

    this.setState({
      editLeft: left + width / 2 - parseFloat(editWidth) / 2,
      editTop: top - parseFloat(editHeight) - 10
    })
  }

  updateMomentumEditPosition() {
    let valueElement = document.querySelector(
      `.grid-arrow[data-id="${this.props.edgeId}"] .momentum`
    )
    let {left, top, width} = valueElement.getBoundingClientRect()
    let {width: editWidth, height: editHeight} = window.getComputedStyle(
      this.editMomentumElement
    )

    this.setState({
      editMomentumLeft: left + width / 2 - parseFloat(editWidth) / 2,
      editMomentumTop: top - parseFloat(editHeight) - 10
    })
  }

  handleButtonClick = id => {
    if (this.buttonClickHandlersCache == null)
      this.buttonClickHandlersCache = {}

    if (this.buttonClickHandlersCache[id] == null) {
      this.buttonClickHandlersCache[id] = evt => {
        let {data, onChange = () => {}} = this.props
        let change = {}

        if (['scalar', 'fermion', 'photon', 'gluon'].includes(id)) {
          change = {line: id}
        } else if (['labelleft', 'labelright'].includes(id)) {
          change = {
            labelPosition: id.slice(5)
          }
        } else if (['momentumleft', 'momentumright'].includes(id)) {
          change = {
            momentumPosition: id.slice(8)
          }
        } else if (['plain', 'particle', 'antiparticle'].includes(id)) {
          let charge = {plain: 0, particle: 1, antiparticle: -1}[id]
          change = {
            charge: data.charge === charge ? 0 : charge
          }
        } else if (['bendleft', 'bendright'].includes(id)) {
          if (data.loop != null) return

          let {bend = 0} = data
          let increase = bend === 0 || (id === 'bendleft' ? bend > 0 : bend < 0)
          let sign = bend !== 0 ? Math.sign(bend) : id === 'bendleft' ? 1 : -1
          let steps = [0, 30, 49, 60, 67, 71, 74, 76, 78, 79, 80]

          let index = steps.reduce(
            (acc, x, i) => (x <= Math.abs(bend) ? i : acc),
            -1
          )
          if (
            index < steps.length - 1 &&
            bend >= (steps[index + 1] + steps[index]) / 2
          )
            index++

          let newBend =
            sign *
            steps[Math.min(index + (+increase * 2 - 1), steps.length - 1)]

          change = {bend: clamp(-80, 80, newBend)}
        }

        onChange({data: {...data, ...change}})
      }
    }

    return this.buttonClickHandlersCache[id]
  }

  handleEditButtonClick = () => {
    this.updateEditPosition()
    this.setState({edit: true})
  }

  handleFormSubmit = evt => {
    evt.preventDefault()
    this.setState({edit: false})
  }

  handleInputBlur = () => {
    this.setState({edit: false})
  }

  handleInputChange = evt => {
    let {value} = evt.currentTarget
    let {onChange = () => {}} = this.props

    onChange({data: {...this.props.data, value}})
  }

  handleInputKeyDown = evt => {
    evt.stopPropagation()
  }

  handleInputKeyUp = evt => {
    if (evt.key === 'Escape') {
      evt.stopPropagation()
      this.setState({edit: false})
    }
  }

  handleMomentumEditButtonClick = () => {
    this.updateMomentumEditPosition()
    this.setState({editMomentum: true})
  }

  handleMomentumFormSubmit = evt => {
    evt.preventDefault()
    this.setState({editMomentum: false})
  }

  handleMomentumInputBlur = () => {
    this.setState({editMomentum: false})
  }

  handleMomentumInputChange = evt => {
    let {value} = evt.srcElement
    let {onChange = () => {}} = this.props

    onChange({data: {...this.props.data, momentum: value}})
  }

  handleMomentumInputKeyDown = evt => {
    evt.stopPropagation()
  }

  handleMomentumInputKeyUp = evt => {
    if (evt.key === 'Escape') {
      evt.stopPropagation()
      this.setState({editMomentum: false})
    }
  }

  render() {
    let data = this.props.data == null ? {} : this.props.data

    return (
      <section
        id="properties"
        class={classNames({
          show: this.props.show,
          edit: this.state.edit,
          editMomentum: this.state.editMomentum
        })}
      >
        <Toolbox>
          <Button
            checked={data.line === 'scalar'}
            icon="./img/particles/scalar.svg"
            name="Scalar"
            onClick={this.handleButtonClick('scalar')}
          />

          <Button
            checked={!data.line || data.line === 'fermion'}
            icon="./img/particles/fermion.svg"
            name="Fermion"
            onClick={this.handleButtonClick('fermion')}
          />

          <Button
            checked={data.line === 'photon'}
            icon="./img/particles/photon.svg"
            name="Photon"
            onClick={this.handleButtonClick('photon')}
          />

          <Button
            checked={data.line === 'gluon'}
            disabled={data.charge === 1 || data.charge === -1}
            icon="./img/particles/gluon.svg"
            name="Gluon"
            onClick={this.handleButtonClick('gluon')}
          />

          <Separator />

          <Button
            checked={!data.charge || data.charge === 0}
            icon="./img/particles/plain.svg"
            name="Uncharged"
            onClick={this.handleButtonClick('plain')}
          />

          <Button
            checked={data.charge === 1}
            disabled={data.line === 'gluon'}
            icon="./img/particles/fermion.svg"
            name="Particle"
            onClick={this.handleButtonClick('particle')}
          />

          <Button
            checked={data.charge === -1}
            disabled={data.line === 'gluon'}
            icon="./img/particles/antifermion.svg"
            name="Antiparticle"
            onClick={this.handleButtonClick('antiparticle')}
          />

          <Separator />

          {data.loop == null ? (
            <>
              <Button
                key="bendright"
                icon="./img/properties/bendright.svg"
                name="Bend Right (Shift+Down Arrow)"
                onClick={this.handleButtonClick('bendright')}
              />

              <Button
                key="bendleft"
                icon="./img/properties/bendleft.svg"
                name="Bend Left (Shift+Up Arrow)"
                onClick={this.handleButtonClick('bendleft')}
              />
            </>
          ) : (
            <>
              <Button
                key="rotate"
                icon="./img/properties/rotate.svg"
                name="Rotate (E)"
                onClick={this.handleButtonClick('rotate')}
              />
            </>
          )}

          <Separator />

          <Button
            checked={!data.labelPosition || data.labelPosition === 'left'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/labelleft.svg"
            name="Left Label (A)"
            onClick={this.handleButtonClick('labelleft')}
          />

          <Button
            checked={data.labelPosition === 'right'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/labelright.svg"
            name="Right Label (D)"
            onClick={this.handleButtonClick('labelright')}
          />

          <Button
            checked={this.state.edit}
            icon="./img/properties/edit.svg"
            name="Edit Label (Enter)"
            onClick={this.handleEditButtonClick}
          />

          <Separator />

          <Button
            checked={!data.momentumPosition || data.momentumPosition === 'left'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/momentumleft.svg"
            name="Left Momentum Label"
            onClick={this.handleButtonClick('momentumleft')}
          />

          <Button
            checked={data.momentumPosition === 'right'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/momentumright.svg"
            name="Right Momentum Label"
            onClick={this.handleButtonClick('momentumright')}
          />

          <Button
            checked={this.state.editMomentum}
            icon="./img/properties/edit.svg"
            name="Edit Momentum Label (Enter)"
            onClick={this.handleMomentumEditButtonClick}
          />

          <Separator />

          <Button
            class="remove"
            icon="./img/properties/trash.svg"
            name="Remove Arrow (Del)"
            onClick={this.props.onRemoveClick}
          />
        </Toolbox>

        <form
          ref={el => (this.editElement = el)}
          class="edit"
          style={{
            left: this.state.editLeft,
            top: this.state.editTop
          }}
          onSubmit={this.handleFormSubmit}
        >
          <input
            ref={el => (this.inputElement = el)}
            type="text"
            value={data.value || ''}
            onBlur={this.handleInputBlur}
            onInput={this.handleInputChange}
            onKeyDown={this.handleInputKeyDown}
            onKeyUp={this.handleInputKeyUp}
          />
        </form>

        <form
          ref={el => (this.editMomentumElement = el)}
          class="editMomentum"
          style={{
            left: this.state.editMomentumLeft,
            top: this.state.editMomentumTop
          }}
          onSubmit={this.handleMomentumFormSubmit}
        >
          <input
            ref={el => (this.momentumInputElement = el)}
            type="text"
            value={data.momentum || ''}
            onBlur={this.handleMomentumInputBlur}
            onInput={this.handleMomentumInputChange}
            onKeyDown={this.handleMomentumInputKeyDown}
            onKeyUp={this.handleMomentumInputKeyUp}
          />
        </form>
      </section>
    )
  }
}
