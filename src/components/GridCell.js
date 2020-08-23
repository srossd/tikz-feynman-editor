import {h, Component} from 'preact'
import classNames from 'classnames'

export default class GridCell extends Component {
  componentDidMount() {
    this.componentDidUpdate()
  }

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.value !== this.props.value ||
      nextProps.edit !== this.props.edit ||
      nextProps.selected !== this.props.selected ||
      nextProps.vertex !== this.props.vertex
    )
  }

  componentDidUpdate(prevProps) {
    let {onTypesetFinish = () => {}, onChange = () => {}} = this.props

    for (let el of this.valueElement.querySelectorAll(
      ['span[id^="MathJax"]', '.MathJax_Preview', 'script'].join(', ')
    )) {
      el.remove()
    }

    if (this.props.value) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])
      MathJax.Hub.Queue(() => {
        onTypesetFinish({
          position: this.props.position,
          element: this.valueElement.querySelector('.MathJax_Preview + span')
        })
      })
    } else {
      onTypesetFinish({
        position: this.props.position,
        element: null
      })
    }

    if (this.props.vertex) {
      onChange({
        position: this.props.position,
        vertex: this.props.vertex
      })
    }

    if (this.inputElement != null && prevProps.edit !== this.props.edit) {
      this.inputElement.select()
    }
  }

  submit = () => {
    let {onSubmit = () => {}} = this.props
    onSubmit({position: this.props.position})
  }

  handleGrabberMouseDown = evt => {
    let {onGrabberMouseDown = () => {}} = this.props

    evt.position = this.props.position
    onGrabberMouseDown(evt)
  }

  handleGrabberDragStart = evt => {
    evt.preventDefault()
  }

  handleEditSubmit = evt => {
    evt.preventDefault()
  }

  handleEditKeyDown = evt => {
    if (evt.key === 'Enter') {
      evt.stopPropagation()
      this.submit()
    }
  }

  handleInputBlur = evt => {
    this.submit()
  }

  stopPropagation = evt => {
    evt.stopPropagation()
  }

  handleInputChange = evt => {
    let {onChange = () => {}} = this.props

    onChange({
      position: this.props.position,
      value: evt.currentTarget.value
    })
  }

  render() {
    return (
      <li
        class={classNames('grid-cell', {
          edit: this.props.edit,
          selected: this.props.selected
        })}
        data-position={this.props.position.join(',')}
      >
        <div class="value" ref={el => (this.valueElement = el)}>
          {this.props.value ? (
            `\\(${this.props.value}\\)`
          ) : (
            <span class="hide">_</span>
          )}
        </div>

        {this.props.edit && (
          <form class="edit" onSubmit={this.handleEditSubmit}>
            <input
              ref={el => (this.inputElement = el)}
              type="text"
              value={this.props.value}
              onBlur={this.handleInputBlur}
              onInput={this.handleInputChange}
              onMouseDown={this.stopPropagation}
              onKeyDown={this.handleEditKeyDown}
            />
          </form>
        )}

        <img
          class="grabber"
          src="./img/grabber.svg"
          onMouseDown={this.handleGrabberMouseDown}
          onDragStart={this.handleGrabberDragStart}
        />

        {this.props.vertex && (
          <img
            class={'vertex' + (this.props.vertex == 'blob' ? ' blob' : '')}
            src={`./img/vertices/${this.props.vertex}.svg`}
          />
        )}
      </li>
    )
  }
}
