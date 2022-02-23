
var App = {
    web3Provider: null,
    contracts: {}
}

$(window).load(function () {

    // web3Provider 생성하기
    if (typeof web3 !== 'undefined') {
        // MetaMask가 설치되어 있어서 web3 인스턴스가 이미 생성되어 있음
        App.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
    } else {
        // MetaMask가 설치되지 않았을 경우 기본 인스턴스를 지정함
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        web3 = new Web3(App.web3Provider);
    }

    // Election.json을 가지고 온다.
    $.getJSON('Election.json', function (election) {
        // Truffle 계약을 초기화 함
        App.contracts.Election = TruffleContract(election);
        // 인스턴스에 접속함
        App.contracts.Election.setProvider(App.web3Provider);

        // 투표하기 이벤트 리스너 생성
        voteEventListener();

        render();
    });

    // 거래가 발생하면 event를 받는다.
    function voteEventListener() {
        App.contracts.Election.deployed()
            .then(function(instance) {
                instance.votedEvent({}, {
                    fromBlock: 0,
                    toBlock: 'lastest'
                }).watch(function(error, event) {
                    console.log('이벤트 트리거됨', event)
                    render()
                })
            })
    }

    // 화면구현
    function render() {

        // 계정 정보 읽어오기
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $('#accountAddress').html('나의 계정: ' + App.account);
            } else {
                console.log(err);
            }
        });

        // 계약 정보를 읽어온다.
        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidatesCount();
        }).then(function (candidatesCount) {

            // 후보자 목록을 reset 한다.
            $('#candidatesResults').empty();
            $('#candidateSelect').empty();

            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function (candidate) {
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];

                    // 투표결과 html 파싱
                    var candidateTemplate = '<tr><th>' + id + '</th><td>' + name + '</td><td>' + voteCount + '</td></tr>'
                    $('#candidatesResults').append(candidateTemplate);

                    // 후보자 목록 표시
                    var candidateOption = '<option value="' + id + '">' + name + '</option>'
                    $('#candidateSelect').append(candidateOption);
                });
            }

            // 후보자 화면 표시
            $('#loader').hide();
            $('#content').show();
        }).catch(function (error) {
            console.warn(error);
        });
    }

    // 투표하기
    $('#btnVote').on('click', function() {
        var candidateId = $('#candidateSelect').val()
        if (!candidateId) {
            return alert('후보자를 선택하세요.')
        }
        App.contracts.Election.deployed()
            .then(function(instance) {
                return instance.vote(candidateId, {from: App.account})
            })
            .then(function(result) {
                if (result.receipt) {
                    alert('성공적으로 투표했습니다.')
                    // location.reload();
                }
            })
            .catch(function(error) {
                alert(error.message)
            })

    })
});
