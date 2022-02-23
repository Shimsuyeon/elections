const Election = artifacts.require('./Election.sol')

contract('Election', accounts => {

    it('후보자 두 명 등록하면 candidatesCount는 2명 이다.', () => {
        return Election.deployed()
            .then(instance => {
                // 두명의 후보자를 등록합니다.
                instance.addCandidate('romeoh')
                instance.addCandidate('doraemong')

                // candidatesCount를 반환한다.
                return instance.candidatesCount()
            })
            .then(count => {
                // count는 2 다.
                assert.equal(count, 2)
            })
    })

    it('후보자 정보를 검증한다.', () => {
        return Election.deployed()
            .then(instance => {
                electionInstance = instance

                // 첫번째 후보자를 반환한다.
                // 위 테스트 코드에서 이미 두명의 후보자가 등록되어 있음
                return electionInstance.candidates(1)
            })
            .then(candidate => {
                assert.equal(candidate[0], 1, '첫번째 후보자 기호는 1번이다.')
                assert.equal(candidate[1], 'romeoh', '첫번째 후보자 이름은 romeoh다.')
                assert.equal(candidate[2], 0, '첫번째 후보자 득표는 0 이다.')

                // 두번째 후보자를 반환한다.
                return electionInstance.candidates(2)
            })
            .then(candidate => {
                assert.equal(candidate[0], 2, '두번째 후보자 기호는 2번이다.')
                assert.equal(candidate[1], 'doraemong', '두번째 후보자 이름은 doraemong이다.')
                assert.equal(candidate[2], 0, '두번째 후보자 득표는 0 이다.')
            })
    })

    it('투표하기', () => {
        return Election.deployed()
            .then(instance => {
                electionInstance = instance
                candidateId = 1

                // 1번 후보자에게 투표함
                return electionInstance.vote(candidateId, {from: accounts[0]})
            })
            .then(receipt => {

                // watch event listener를 검증한다.
                assert.equal(receipt.logs.length, 1, '이벤트가 트리거됨')
                assert.equal(receipt.logs[0].event, 'votedEvent', '트리거된 이벤트는 votedEvent다.')
                assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, '트리거된 이벤트의 candidateId를 검증한다.')

                // account[0] 계정 주소를 반환함
                return electionInstance.voters(accounts[0])
            })
            .then(voted => {
                assert(voted, 'account[0]의 계정 주소가 투표한 것을 확인한다.')

                // 1번 후보자를 반환함
                return electionInstance.candidates(candidateId)
            })
            .then(candidate => {
                const voteCount = candidate.voteCount.toNumber()
                assert(voteCount, 1, '1번 후보자의 득표는 1 이다.')
            })
    })

    it('투표 유효성 검사', () => {
        return Election.deployed()
            .then(instance => {
                electionInstance = instance

                // 유효하지 않은 후보자에게 투표한다.
                return electionInstance.vote(99, {from: accounts[0]})
            })
            .then(assert.fail)
            .catch(error => {
                assert(error.message.indexOf('revert') >= 0, '유효하지 않은 후보자에게 투표하면 exception이 발생해야 한다.')

                // 1번 후보자를 반환한다.
                return electionInstance.candidates(1)
            })
            .then(candidate1 => {
                const voteCount = candidate1.voteCount.toNumber()
                assert.equal(voteCount, 1, 'exception 발생 이후 1번 후보자의 득표는 여전히 1 이어야 한다.')

                // 1번 후보자를 반환한다.
                return electionInstance.candidates(2)
            })
            .then(candidate1 => {
                const voteCount = candidate1.voteCount.toNumber()
                assert.equal(voteCount, 0, '2번 후보자의 득표수는 0이다.')
            })
    })

    it('중복 투표를 방지한다.', () => {
        return Election.deployed()
            .then(instance => {
                electionInstance = instance

                // 2번 후보자에게 2번째 계정으로 투표한다.
                candidateId = 2
                electionInstance.vote(candidateId, {from: accounts[1]})

                // 2번 후보자를 반환한다.
                return electionInstance.candidates(candidateId)
            })
            .then(candidate2 => {
                const voteCount = candidate2.voteCount.toNumber()
                assert.equal(voteCount, 1, '첫 번째 투표는 정상적으로 작동해야한다.')

                // 같은 후보자에게 같은 계정으로 다시 투표한다.
                return electionInstance.vote(candidateId, {from: accounts[1]})
            })
            .then(assert.fail)
            .catch(error => {
                assert(error.message.indexOf('revert') >= 0, '같은 게정으로 투표할 수 없어야 한다.')

                // 1번 후보자를 반환한다.
                return electionInstance.candidates(1)
            })
            .then(candidate1 => {
                const voteCount = candidate1.voteCount.toNumber()
                assert.equal(voteCount, 1, '1번 후보자는 득표는 1 이 유지되고 있음')

                // 2번 후보자를 반환한다.
                return electionInstance.candidates(2)
            })
            .then(candidate2 => {
                const voteCount = candidate2.voteCount.toNumber()
                assert.equal(voteCount, 1, '2번 후보자의 득표는 1이다.')
            })
    })
})
