import * as React from 'react'

export namespace Tyre {

  declare type TyreHandlerCallback<Props, State, Action> = (payload : any, self : TyreSelf<Props, State, Action>) => void
  declare type TyreReducerCallback<Action> = (event : any) => Action
  declare type TyrePayloadFunction = (payload : any) => void

  declare interface TyreSelf<Props, State, Action> {
    state : State,
    retainedProps : Props,
    handle : (callback : TyreHandlerCallback<Props, State, Action>) => TyrePayloadFunction,
    reduce : (callback : TyreReducerCallback<Action>) => TyrePayloadFunction
  }

  declare type RenderProps<Props> = Props & Readonly<{ children? : React.ReactNode }>

  declare interface TyreStatelessSpec<Props> {
    render : (self : TyreSelf<Props, null, null>, props? : RenderProps<Props>) => React.ReactElement<any>
  }

  declare interface TyreSpec<Props, State, Action> {
    reducer? : (action : Action, state : State) => UpdateTag<State>,
    render : (self : TyreSelf<Props, State, Action>, props? : RenderProps<Props>) => React.ReactElement<any>,
    /* Lifecycle events */
    initialState? : () => State,
    didMount? : (self : TyreSelf<Props, State, Action>) => UpdateTag<State>,
    willReceiveProps? : (self : TyreSelf<Props, State, Action>) => UpdateTag<State>,
    shouldUpdate? : (oldSelf : TyreSelf<Props, State, Action>, newSelf : TyreSelf<Props, State, Action>) => boolean,
    willUpdate? : (oldSelf : TyreSelf<Props, State, Action>, newSelf : TyreSelf<Props, State, Action>) => void,
    didUpdate? : (oldSelf : TyreSelf<Props, State, Action>, newSelf : TyreSelf<Props, State, Action>) => void,
    willUnmount? : (self : TyreSelf<Props, State, Action>) => void,
  }

  type SideEffectFun<State> = (self : TyreSelf<any, State, any>) => void

  interface InternalTyreState<State> {
    reasonState : State,
    reasonStateVersion : number,
    reasonStateVersionUsedToComputeSubelements : number,
    sideEffects : SideEffectFun<State>[]
  }

  enum UpdateTypes {
    NoUpdate = 0,
    Update,
    SilentUpdate,
    SideEffects,
    UpdateWithSideEffects,
    SilentUpdateWithSideEffects
  }

  type UpdateTag<State> = {
    tag : UpdateTypes,
    state? : State,
    callback? : (self : TyreSelf<any, State, any>) => void
  }

  export function NoUpdate<State>() : UpdateTag<State> {
    return {tag: UpdateTypes.NoUpdate}
  }

  export function Update<State>(state : State) : UpdateTag<State> {
    return {tag: UpdateTypes.Update, state}
  }

  export function SilentUpdate<State>(state : State) : UpdateTag<State> {
    return {tag: UpdateTypes.SilentUpdate, state}
  }

  export function SideEffects<State>(callback : (self : TyreSelf<any, State, any>) => void) : UpdateTag<State> {
    return {tag: UpdateTypes.SideEffects, callback}
  }

  export function UpdateWithSideEffects<State>(state : State, callback : (self : TyreSelf<any, State, any>) => void) : UpdateTag<State> {
    return {tag: UpdateTypes.UpdateWithSideEffects, state, callback}
  }

  export function SilentUpdateWithSideEffects<State>(state : State, callback : (self : TyreSelf<any, State, any>) => void) : UpdateTag<State> {
    return {tag: UpdateTypes.SilentUpdateWithSideEffects, state, callback}
  }


  function createComponent<Props, State, Action>(debugName : string, spec : TyreSpec<Props, State, Action>) {
    const TyreClass = class Tyre extends React.Component<Props, InternalTyreState<State>> {
      constructor(props? : Props) {
        super(props)

        const initialReasonState = spec.initialState ? spec.initialState() : null
        this.state               = {
          reasonState: initialReasonState,
          reasonStateVersion: 1,
          reasonStateVersionUsedToComputeSubelements: 1,
          sideEffects: []
        }
      }

      private self(state : State, props : Props) : TyreSelf<Props, State, Action> {
        return {
          state: state,
          retainedProps: props,
          handle: (callback : TyreHandlerCallback<Props, State, Action>) => this.handleMethod(callback),
          reduce: (callback : TyreReducerCallback<Action>) => this.reduceMethod(callback)
        }
      }

      private transitionNextTotalState(curTotalState : InternalTyreState<State>, reasonStateUpdate : UpdateTag<State>) : InternalTyreState<State> {
        switch (reasonStateUpdate.tag | 0) {
          case UpdateTypes.NoUpdate :
            return curTotalState
          case UpdateTypes.Update:
            return {
              reasonState: reasonStateUpdate.state,
              reasonStateVersion: curTotalState.reasonStateVersion + 1 | 0,
              reasonStateVersionUsedToComputeSubelements: curTotalState.reasonStateVersionUsedToComputeSubelements,
              sideEffects: curTotalState.sideEffects
            }
          case UpdateTypes.SilentUpdate :
            return {
              reasonState: reasonStateUpdate.state,
              reasonStateVersion: curTotalState.reasonStateVersion + 1 | 0,
              reasonStateVersionUsedToComputeSubelements: curTotalState.reasonStateVersionUsedToComputeSubelements + 1 | 0,
              sideEffects: curTotalState.sideEffects
            }
          case UpdateTypes.SideEffects :
            return {
              reasonState: curTotalState.reasonState,
              reasonStateVersion: curTotalState.reasonStateVersion + 1 | 0,
              reasonStateVersionUsedToComputeSubelements: curTotalState.reasonStateVersionUsedToComputeSubelements + 1 | 0,
              sideEffects: [
                reasonStateUpdate.callback,
                ...curTotalState.sideEffects
              ]
            }
          case UpdateTypes.UpdateWithSideEffects :
            return {
              reasonState: reasonStateUpdate.state,
              reasonStateVersion: curTotalState.reasonStateVersion + 1 | 0,
              reasonStateVersionUsedToComputeSubelements: curTotalState.reasonStateVersionUsedToComputeSubelements,
              sideEffects: /* :: */[
                reasonStateUpdate.callback,
                ...curTotalState.sideEffects
              ]
            }
          case 4 :
            return {
              reasonState: reasonStateUpdate.state,
              reasonStateVersion: curTotalState.reasonStateVersion + 1 | 0,
              reasonStateVersionUsedToComputeSubelements: curTotalState.reasonStateVersionUsedToComputeSubelements + 1 | 0,
              sideEffects: /* :: */[
                reasonStateUpdate.callback,
                ...curTotalState.sideEffects
              ]
            }
        }
      }

      private handleMethod(callback : TyreHandlerCallback<Props, State, Action>) : TyrePayloadFunction {
        return (payload : any) : void => {
          const curState       = this.state
          const curReasonState = curState.reasonState

          return callback(payload, this.self(curReasonState, this.props))
        }
      }

      private reduceMethod(callback : TyreReducerCallback<Action>) : TyrePayloadFunction {
        return (event : Action) => {
          const action = callback(event)
          return this.setState((curTotalState) => {
            const curReasonState    = curTotalState.reasonState
            const reasonStateUpdate = spec.reducer(action, curReasonState)
            if (reasonStateUpdate) {
              const nextTotalState = this.transitionNextTotalState(curTotalState, reasonStateUpdate)
              if (nextTotalState.reasonStateVersion !== curTotalState.reasonStateVersion) {
                return nextTotalState
              } else {
                return null
              }
            } else {
              return null
            }
          })
        }
      }

      public componentDidMount() {
        if (spec.didMount) {
          const curTotalState     = this.state
          const curReasonState    = curTotalState.reasonState
          const self              = this.self(curReasonState, this.props)
          const reasonStateUpdate = spec.didMount(self)
          const nextTotalState    = this.transitionNextTotalState(curTotalState, reasonStateUpdate)
          if (nextTotalState.reasonStateVersion !== curTotalState.reasonStateVersion) {
            return this.setState(nextTotalState)
          } else {
            return 0
          }
        } else {
          return NoUpdate()
        }
      }

      public componentDidUpdate(prevProps : Props, prevState : InternalTyreState<State>) {
        const curState       = this.state
        const curReasonState = curState.reasonState
        const newJsProps     = this.props
        if (spec.didUpdate) {
          const prevReasonState                          = prevState.reasonState
          const newSelf                                  = this.self(curReasonState, newJsProps)
          const oldSelf : TyreSelf<Props, State, Action> = {
            ...newSelf,
            state: prevReasonState,
            retainedProps: prevProps
          }

          return spec.didUpdate(oldSelf, newSelf)
        } else {
          return 0
        }
      }

      public componentWillUnmount() {
        if (spec.willUnmount) {
          const curState       = this.state
          const curReasonState = curState.reasonState
          return spec.willUnmount(this.self(curReasonState, this.props))
        } else {
          return 0
        }
      }

      public componentWillUpdate(nextProps : Props, nextState : InternalTyreState<State>) {
        if (spec.willUpdate) {
          const curState        = this.state
          const curReasonState  = curState.reasonState
          const nextReasonState = nextState.reasonState
          const newSelf         = this.self(nextReasonState, nextProps)

          const oldSelf = {
            ...newSelf,
            state: curReasonState,
            retainedProps: this.props
          }

          return spec.willUpdate(oldSelf, newSelf)
        } else {
          return 0
        }
      }

      public componentWillReceiveProps(nextProps : Props) {
        if (spec.willReceiveProps) {
          const oldConvertedReasonProps = this.props
          return this.setState((curTotalState) => {
            const curReasonState         = curTotalState.reasonState
            const curReasonStateVersion  = curTotalState.reasonStateVersion
            const oldSelf                = this.self(curReasonState, oldConvertedReasonProps)
            const nextState              = spec.willReceiveProps(oldSelf)
            const nextReasonState        = this.transitionNextTotalState(curTotalState, nextState)
            const nextReasonStateVersion = nextReasonState.reasonStateVersion
            if (nextReasonStateVersion !== curReasonStateVersion) {
              return {
                reasonState: nextReasonState,
                reasonStateVersion: nextReasonStateVersion,
                reasonStateVersionUsedToComputeSubelements: curTotalState.reasonStateVersionUsedToComputeSubelements,
                sideEffects: nextReasonState.sideEffects
              }
            } else {
              return curTotalState
            }
          })
        } else {
          return 0
        }
      }

      public shouldComponentUpdate(nextJsProps : Props, nextState : InternalTyreState<State>) {
        const curJsProps                                     = this.props
        const propsWarrantRerender                           = nextJsProps !== curJsProps
        const nextReasonStateVersion                         = nextState.reasonStateVersion
        const nextReasonStateVersionUsedToComputeSubelements = nextState.reasonStateVersionUsedToComputeSubelements
        const stateChangeWarrantsComputingSubelements        = nextReasonStateVersionUsedToComputeSubelements !== nextReasonStateVersion
        const warrantsUpdate                                 = propsWarrantRerender || stateChangeWarrantsComputingSubelements
        const nextReasonState                                = nextState.reasonState
        const newSelf                                        = this.self(nextReasonState, nextJsProps)
        let ret                                              = null
        if (warrantsUpdate && spec.shouldUpdate) {
          const curState       = this.state
          const curReasonState = curState.reasonState

          const oldSelf = {
            ...newSelf,
            state: curReasonState,
            retainedProps: this.props
          }

          ret = spec.shouldUpdate(oldSelf, newSelf)
        } else {
          ret = warrantsUpdate
        }

        nextState.reasonStateVersionUsedToComputeSubelements = nextReasonStateVersion
        if (nextState.sideEffects.length !== 0) {
          for (let i = nextState.sideEffects.length - 1; i >= 0; i--) {
            (nextState.sideEffects[i])(newSelf)
          }

          const nextStateNoSideEffects = {
            reasonState: nextState.reasonState,
            reasonStateVersion: nextState.reasonStateVersion,
            reasonStateVersionUsedToComputeSubelements: nextReasonStateVersion,
            sideEffects: [] as SideEffectFun<State>[]
          }
          this.setState(nextStateNoSideEffects)
        }
        return ret
      }


      public render() {
        return spec.render(this.self(this.state.reasonState, this.props), this.props)
      }
    };

    (TyreClass as any).displayName = debugName

    return TyreClass
  }


  export function createStatelessComponent<Props>(debugName : string, spec : TyreStatelessSpec<Props>) {
    return createComponent<Props, null, null>(debugName, spec)
  }

  export function createReducerComponent<Props, State, Action>(debugName : string, spec : TyreSpec<Props, State, Action>) {
    return createComponent<Props, State, Action>(debugName, spec)
  }

}
