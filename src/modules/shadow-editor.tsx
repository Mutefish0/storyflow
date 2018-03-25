import React from 'react'
import { MAST, Block, Inline, Heading, ListItem, Blockquote, Paragraph } from 'libs/markdown'
import hljs from 'highlight.js'
import Caret from 'base/caret'
import classNames from 'classnames'

const LINE_HEIGHT = 22
const PADDING = 14 

interface Point {
    offset: number
    line: number
    column: number
}

interface Location {
    start: Point
    end: Point
}

const cursorSplitElement = (selectionRange, source, location) => {
    const sStart = selectionRange[0]
    const sEnd = selectionRange[1]
    const iStart = location.start.offset
    const iEnd = location.end.offset

    const noneSelected =
        sEnd < iStart
        || sStart > iEnd
    let innerView

    if (noneSelected) {
        innerView = source.slice(iStart, iEnd)
    } else {
        const leftCut = Math.max(sStart, iStart)
        const rightCut = Math.min(sEnd, iEnd)
        const isCollapsed = leftCut == rightCut

        innerView = [
            <span
                key='0'
                data-range={[iStart, leftCut]}
            >
                {source.slice(iStart, leftCut)}
            </span>,
            <span
                key='1' className='selected'
                data-range={[leftCut, rightCut]}
            >
                {
                    isCollapsed ?
                        <span className='cursor'></span>
                        : source.slice(leftCut, rightCut)
                }
            </span>,
            <span
                key='2'
                data-range={[rightCut, iEnd]}
            >
                {source.slice(rightCut, iEnd)}
            </span>
        ]
    }
    return innerView 
}


const leafElement = (selectionRange, source, leaf, index) => {
    switch (leaf.type) {
        case 'link':
            return (
                <span
                    className={leaf.type}
                    key={index}
                >
                    {prefixElement(source, leaf, selectionRange)}
                    {leafElement(selectionRange, source, leaf.children[0], index)}
                    {suffixElement(source, leaf, selectionRange)}
                </span>
            )
        default:
            return (
                <span
                    className={leaf.type}
                    key={index}
                    data-range={[leaf.location.start.offset, leaf.location.end.offset]}
                >
                    {cursorSplitElement(selectionRange, source, leaf.location)}
                </span>
            )
    }
}

const prefixElement = (source, block, selectionRange) => {
    let start = block.children[0].location.start.offset 
    let _start = block.location.start.offset
    return (
        <span 
            className={`${block.type}-prefix`} 
            key='prefix'
            data-range={[_start, start]}
        >
            {cursorSplitElement(selectionRange, source, { start: { offset: _start }, end: { offset: start } })}
        </span>
    )
}

const suffixElement = (source, block, selectionRange) => {
    let end = block.children[block.children.length - 1].location.end.offset
    let _end = block.location.end.offset
    return (
        <span 
            className={`${block.type}-suffix`} 
            key='suffix' 
            data-range={[end, _end]}
        >
            {cursorSplitElement(selectionRange, source, { start: { offset: end }, end: { offset: _end } })}
        </span>
    )
}

const block2ReactElement = (selectionRange, source, block: Block, index) => {
    switch (block.type) {
        case 'blockquote':
            return (
                <span key={index} className={block.type}>
                    {block.children.map(block2ReactElement.bind({}, selectionRange, source)) }
                </span>
            )
        case 'blockquote_unit':
            return (
                <span key={index} className={block.type}>
                    {prefixElement(source, block, selectionRange)}
                    {block.children.map(block2ReactElement.bind({}, selectionRange, source))}
                    {suffixElement(source, block, selectionRange)}
                </span>
            )
        case 'paragraph':
        case 'heading':
        case 'list_item':
            return (
                <span key={index} className={block.type}>
                    {prefixElement(source, block, selectionRange)}
                    {block.children.map(leafElement.bind({}, selectionRange, source))}
                    {suffixElement(source, block, selectionRange)}
                </span>
            )
        case 'thematic_break':
        case 'blank_lines':
            return leafElement(selectionRange, source, block, index)
        case 'code_block':
        case 'link_reference_definition':
            return (
                <span 
                    key={index} className={block.type}
                >
                    {prefixElement(source, block, selectionRange)}
                    {leafElement(selectionRange, source, block.children[0], index)}
                    {suffixElement(source, block, selectionRange)}
                </span>
            )
        case 'list':
            return (
                <span key={index} className={block.type}>
                    {block.children.map(block2ReactElement.bind({}, selectionRange, source))}
                </span>
            )
        default:
            return undefined
    }  
}

const ast2ReactElement = (source: string, ast: Block[], selectionRange) => {
    return ast.map(block2ReactElement.bind({}, selectionRange, source))
}

interface Props {
    ast: MAST, 
    onCursorChange: Function,
    selectionRange: [number, number],
    focused: boolean
}

interface State {
    isCursorSleep: boolean
}

class ShadowEditor extends React.Component<Props, State> {
    constructor (props) {
        super(props)
        this.state = {
            isCursorSleep: true
        }
        let self = this as any 
        self.cursorSleepTimeout = null 
        self.previousReceivedCursorRange = this.props.selectionRange
    }

    componentWillReceiveProps (nextProps) {
        const newRange = nextProps.selectionRange
        const range = this.props.selectionRange
        if (newRange[0] != range[0] || newRange[1] != range[1]) {
            this.setState({isCursorSleep: false})
            clearTimeout((this as any).cursorSleepTimeout)
            setTimeout(() => this.setState({isCursorSleep: true }), 800)
        }
    }

    setCursorByClickTextContent (e) {
        const range = Caret.getRange()

        const startContainer = range.startContainer.parentElement
        const endContainer = range.endContainer.parentElement

        const sRang = startContainer.getAttribute('data-range')
        const eRange = endContainer.getAttribute('data-range')

        if (sRang && eRange) {
            const baseStartOffset = parseInt(sRang.split(',')[0])
            const baseEndOffset = parseInt(eRange.split(',')[0])

            let cursorRange = [baseStartOffset + range.startOffset, baseEndOffset + range.endOffset]
            const prevRange = (this as any).previousReceivedCursorRange

            //shift点击选中适配
            if (e.shiftKey) {
                cursorRange = [Math.min(cursorRange[0], prevRange[0]), Math.max(cursorRange[1], prevRange[1])]
            }

            this.props.onCursorChange(cursorRange)

            let self = this as any
            self.previousReceivedCursorRange = cursorRange
        }

        e.stopPropagation()
        e.preventDefault()
    }

    render () {

        let view = ast2ReactElement(
            this.props.ast.source, 
            this.props.ast.entities,
            this.props.selectionRange
        )
        return (
            <div 
                onClick={this.setCursorByClickTextContent.bind(this)}

                className={classNames([
                    'shadow-editor',
                    { 'cursor-sleep': this.state.isCursorSleep},
                    {'focused': this.props.focused}
                ])}
                ref="pre"
                >
                {view}
            </div>
        )
    }
}

export default ShadowEditor