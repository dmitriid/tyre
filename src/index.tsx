import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Tyre} from './TyreReact'
import createReducerComponent = Tyre.createReducerComponent
import NoUpdate = Tyre.NoUpdate
import createStatelessComponent = Tyre.createStatelessComponent


interface Props {
    a: string
}

interface State {
    count: number,
    timerId: number
}

enum Action {
    Increment = 0,
    Decrement,
    SilentDecrement,
    Tick,
    SideEffect,
}

type DataAction = { tag: number, data: number }

type AllActions = Action | DataAction

const Co = createStatelessComponent<Props>('Co', {
    render: (self, props) => <div>
        aaa
        <div>{props.a}</div>
        <div>{self.state}</div>
        <div>{props.children}</div>
    </div>
})


const click = (event: any, self: any) => {
    console.log(event)
    console.log(self)
}

const CoRe = createReducerComponent<Props, State, AllActions>('CoRe', {
    initialState: () => {
        return {count: 0, timerId: 0}
    },
    didMount: (self) => {
        self.state.timerId = window.setInterval(self.reduce(() => Action.Tick), 1000)

        return NoUpdate()
    },
    reducer: (action: AllActions, state: State) => {
        switch (action) {
            case Action.Increment:
                return Tyre.Update({...state, count: state.count + 1})
            case Action.Decrement:
                return Tyre.Update({...state, count: state.count - 1})
            case Action.SilentDecrement:
                return Tyre.SilentUpdate({...state, count: state.count - 1})
            case Action.Tick:
                return Tyre.Update({...state, count: state.count + 1})
            case Action.SideEffect:
                return Tyre.SideEffects((self) => console.log(self))
            default:
                const {tag, data} = action
                switch (tag) {
                    case Action.Increment:
                        return Tyre.Update({...state, count: state.count + data})
                }
        }
    },
    render: (self, props) => <div>
        aaa
        <div style={{width: '200px', height: '200px', backgroundColor: '#eee'}}
             onMouseMove={self.reduce(() => Action.SilentDecrement)}>{props.a}</div>
        <div>{self.state.count}</div>
        <div>{props.children}</div>
        <button onClick={self.handle(click)}>Click here (self.handle, see console)</button>
        <br/>
        <br/>
        <button onClick={self.reduce((e) => Action.Increment)}>Increment</button>
        <button onClick={self.reduce((e) => Action.Decrement)}>Decrement</button>
        <br/>
        <br/>
        <button onClick={self.reduce((e) => Action.SideEffect)}>SideEffect (see console)</button>
        <br/>
        <br/>
        <button onClick={self.reduce((e) => {
            return {tag: Action.Increment, data: 100}
        })}>Increment by 100 (action with payload)
        </button>
    </div>
})

ReactDOM.render(<CoRe a="a">
    <div>child</div>
    <Co a="c0 --- aaaaa">
        <div>co---child</div>
    </Co>
</CoRe>, document.getElementById('app'))
