export const execute1 = async(data: any = []) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`Async operation 1 completes..`)
        }, 100)
    })
}

export const execute2 = async(data: any = []) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`Async operation 2 completes..`)
        }, 2000)
    })
}

export const execute3 = async(data: any = []) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`Async operation 3 completes..`)
        }, 3000)
    })
}