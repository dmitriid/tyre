# tyre
A port of [ReasonReact](https://reasonml.github.io/reason-react/) to Typescript 

## What

A very straightforward copy-paste of ReasonReact: 

- Look into docs
- Understand what they say
- Look into Reason code
- Look into generated JavaScrip code
- Port (or copy-paste generated JS)
- Fix bugs
- Make sure it works
- ???
- Fun (no profit) 

## How

Everything in the docs up to and including "Lifecycles" should work.

- Implementation in [src/TyreReact.tsx](src/TyreReact.tsx).
- Usage exmple in [src/index.tsx](src/index.tsx)


**In Reason**

```reasonml
type action =
  | Click
  | Toggle;

type state = {count: int, show: bool};

let component = ReasonReact.reducerComponent "MyForm";

let make _children => {
  ...component,
  initialState: fun () => {count: 0, show: false},
  reducer: fun action state =>
    switch action {
    | Click => ReasonReact.Update {...state, count: state.count + 1}
    | Toggle => ReasonReact.Update {...state, show: not state.show}
    },
  render: fun self => {
    let message = "Clicked " ^ string_of_int self.state.count ^ " times(s)";
    <div>
      <MyDialog
        onClick=(self.reduce (fun _event => Click))
        onSubmit=(self.reduce (fun _event => Toggle)) />
      (ReasonReact.stringToElement message)
    </div>
  }
};
```

**In Typescript**

```typescript jsx
import {Tyre} from './TyreReact'
import createReducerComponent = Tyre.createReducerComponent

enum Action {
    Click = 0,
    Toggle
}

type State = {count: number, show: boolean}

const Component = createReducerComponent<null, State, Action>('MyForm', {
    initialState: () => {
        return {count: 0, show: false}
    },
    reducer: (action : Action, state : State) => {
        switch (action) {
            case Action.Click:
                return Tyre.Update({...state, count: state.count + 1})
            case Action.Toggle:
                return Tyre.Update({...state, show: !state.show})
        }
    },
    render: (self) => {
        const message = `Clicked ${self.state.count} times(s)`
        return <div>
            <MyDialog
                onClick={self.reduce ((_event) => Action.Click)}
                onSubmit={self.reduce ((_event) => Action.Toggle)} />
            message
        </div>
    }
})
```
