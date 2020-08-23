import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent
} from 'lz-string'

import {
  getId,
  arrEquals,
  arrSubtract,
  b64DecodeUnicode,
  b64EncodeUnicode
} from './helper'

export function toJSON(diagram) {
  let leftTop = [0, 1].map(i =>
    diagram.nodes.reduce(
      (min, node) => Math.min(min, node.position[i]),
      Infinity
    )
  )

  return JSON.stringify({
    nodes: diagram.nodes.map(node => ({
      ...node,
      id: undefined,
      position: arrSubtract(node.position, leftTop)
    })),

    edges: diagram.edges.map(edge => ({
      ...edge,
      from: diagram.nodes.findIndex(node => node.id === edge.from),
      to: diagram.nodes.findIndex(node => node.id === edge.to)
    }))
  })
}

export function fromJSON(json) {
  let obj = JSON.parse(json)
  let nodes = obj.nodes.map(node => ({
    ...node,
    id: getId()
  }))

  return {
    nodes,
    edges: obj.edges.map(edge => ({
      ...edge,
      from: nodes[edge.from].id,
      to: nodes[edge.to].id
    }))
  }
}

export function toBase64(diagram) {
  return b64EncodeUnicode(toJSON(diagram))
}

export function fromBase64(base64) {
  return fromJSON(b64DecodeUnicode(base64))
}

export function toCompressedBase64(diagram) {
  return compressToEncodedURIComponent(toJSON(diagram))
}

export function fromCompressedBase64(compressed) {
  return fromJSON(decompressFromEncodedURIComponent(compressed))
}

export function toTeX(diagram) {
  let origin = diagram.nodes.reduce(
    (acc, node) => {
      return {
        x: Math.min(acc.x, node.position[0]),
        y: Math.min(acc.y, -node.position[1])
      }
    },
    {x: Infinity, y: Infinity}
  )

  let vertices = diagram.nodes.map(node => {
    var adjx = node.position[0] - origin.x
    var adjy = -node.position[1] - origin.y

    var label = node.value ? ' {\\(' + node.value + '\\)}' : ''

    var start = node.vertex
      ? '\\node[' + node.vertex.replace('_', ' ') + ']'
      : '\\vertex'

    return `${start} (${node.id}) at (${2 * adjx}, ${2 * adjy})${label};`
  })

  let edges = diagram.edges.map((edge, i) => {
    var linetype = {
      'scalar -1': 'anti charged scalar',
      'scalar 0': 'scalar',
      'scalar 1': 'charged scalar',
      'fermion -1': 'anti fermion',
      'fermion 0': 'plain',
      'fermion 1': 'fermion',
      'photon -1': 'anti charged boson',
      'photon 0': 'photon',
      'photon 1': 'charged boson',
      'gluon 0': 'gluon'
    }[(edge.line || 'fermion') + ' ' + (edge.charge || '0')]

    var bend =
      edge.bend > 0
        ? ',bend left=' + edge.bend
        : edge.bend < 0
        ? ',bend right=' + -edge.bend
        : ''

    var label = edge.value
      ? ',edge label' +
        (edge.labelPosition === 'right' ? "'" : '') +
        '={\\(' +
        edge.value +
        '\\)}'
      : ''

    var momentumLabel = edge.momentum
      ? ',momentum' +
        (edge.momentumPosition === 'right' ? "'" : '') +
        '={\\(' +
        edge.momentum +
        '\\)}'
      : ''

    return `(${edge.from}) --[${linetype}${bend}${label}${momentumLabel}] (${edge.to})`
  })

  return (
    '\\begin{tikzpicture}\n\\begin{feynman}\n' +
    vertices.join('\n') +
    '\n\\diagram*{\n' +
    edges.map(x => '\t' + x).join(',\n') +
    '\n};\n\\end{feynman}\n\\end{tikzpicture}'
  )
}
