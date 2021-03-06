import { all, call, fork, put, takeLatest } from 'redux-saga/effects';
import { getSocketStatus, sendSocketTopic, socketEnd } from './reducer'
import store from '../index';
export function* closeSocket(){
    try {
        if (window.loopringSocket){
            yield call(window.loopringSocket.socketClose)
        }
        yield put(getSocketStatus(undefined));
        //TODO check wallect store
    } catch (err) {
        yield put(getSocketStatus(err));
    }
}
export function* sendMessage({payload}: any){
    try {
        const { apiKey } = store.getState().account;
        const { socket } = payload;
        if (window.loopringSocket){
            yield call(window.loopringSocket.socketSendMessage, { socket, apiKey })
        }
        yield put(getSocketStatus(undefined));
    } catch (err) {
        yield put(getSocketStatus(err));
    }
}

function* socketEndSaga(){
    yield all([takeLatest(socketEnd, closeSocket)]);
}

function* socketSendMessageSaga() {
    yield all([takeLatest(sendSocketTopic, sendMessage)]);
}



export const socketForks = [
    // fork(socketSaga),
    fork(socketEndSaga),
    fork(socketSendMessageSaga),
 //   fork(initConfig),
]



