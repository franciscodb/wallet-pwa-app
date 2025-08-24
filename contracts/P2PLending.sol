// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract P2PLending is ReentrancyGuard, Ownable {
    // Estructuras
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        uint256 startTime;
        uint256 creditScore;
        string purpose;
        LoanStatus status;
        uint256 repaidAmount;
        address[] lenders;
        uint256 totalLended;
    }

    struct LoanRequest {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        uint256 creditScore;
        string purpose;
        bool active;
        uint256 fundedAmount;
        address[] investors;
    }

    struct UserProfile {
        uint256 creditScore;
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 totalLended;
        uint256 totalEarned;
        uint256 activeLoans;
        uint256 completedLoans;
        bool isRegistered;
    }

    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Cancelled
    }

    // Variables de estado
    uint256 public loanCounter;
    uint256 public requestCounter;
    uint256 public platformFee = 100; // 1%
    
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => LoanRequest) public loanRequests;
    mapping(address => UserProfile) public userProfiles;
    mapping(uint256 => mapping(address => uint256)) public lenderAmounts;
    mapping(uint256 => mapping(address => uint256)) public requestInvestments;
    
    // Eventos
    event LoanRequestCreated(uint256 indexed requestId, address indexed borrower, uint256 amount);
    event LoanFunded(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event InvestmentMade(uint256 indexed requestId, address indexed investor, uint256 amount);
    event UserRegistered(address indexed user, uint256 creditScore);

    constructor() Ownable(msg.sender) {}

    // Registrar usuario
    function registerUser(uint256 _creditScore) external {
        require(!userProfiles[msg.sender].isRegistered, "Already registered");
        require(_creditScore >= 300 && _creditScore <= 850, "Invalid credit score");
        
        userProfiles[msg.sender] = UserProfile({
            creditScore: _creditScore,
            totalBorrowed: 0,
            totalRepaid: 0,
            totalLended: 0,
            totalEarned: 0,
            activeLoans: 0,
            completedLoans: 0,
            isRegistered: true
        });
        
        emit UserRegistered(msg.sender, _creditScore);
    }

    // Crear solicitud de préstamo
    function createLoanRequest(
        uint256 _amount,
        uint256 _interestRate,
        uint256 _duration,
        string memory _purpose
    ) external nonReentrant returns (uint256) {
        require(userProfiles[msg.sender].isRegistered, "Not registered");
        require(_amount > 0, "Invalid amount");
        require(_interestRate > 0 && _interestRate <= 5000, "Invalid interest rate");
        
        requestCounter++;
        
        LoanRequest storage request = loanRequests[requestCounter];
        request.id = requestCounter;
        request.borrower = msg.sender;
        request.amount = _amount;
        request.interestRate = _interestRate;
        request.duration = _duration;
        request.creditScore = userProfiles[msg.sender].creditScore;
        request.purpose = _purpose;
        request.active = true;
        
        emit LoanRequestCreated(requestCounter, msg.sender, _amount);
        return requestCounter;
    }

    // Invertir en préstamo
    function investInLoan(uint256 _requestId) external payable nonReentrant {
        LoanRequest storage request = loanRequests[_requestId];
        require(request.active, "Request not active");
        require(msg.sender != request.borrower, "Cannot invest in own loan");
        require(msg.value > 0, "Invalid amount");
        
        uint256 remainingAmount = request.amount - request.fundedAmount;
        uint256 investmentAmount = msg.value > remainingAmount ? remainingAmount : msg.value;
        
        // Guardar inversión
        if (requestInvestments[_requestId][msg.sender] == 0) {
            request.investors.push(msg.sender);
        }
        requestInvestments[_requestId][msg.sender] += investmentAmount;
        request.fundedAmount += investmentAmount;
        
        // Devolver exceso
        if (msg.value > investmentAmount) {
            payable(msg.sender).transfer(msg.value - investmentAmount);
        }
        
        emit InvestmentMade(_requestId, msg.sender, investmentAmount);
        
        // Si está completamente financiado, crear el préstamo
        if (request.fundedAmount >= request.amount) {
            _createLoanFromRequest(_requestId);
        }
    }

    // Crear préstamo desde solicitud
    function _createLoanFromRequest(uint256 _requestId) private {
        LoanRequest storage request = loanRequests[_requestId];
        
        loanCounter++;
        Loan storage loan = loans[loanCounter];
        loan.id = loanCounter;
        loan.borrower = request.borrower;
        loan.amount = request.amount;
        loan.interestRate = request.interestRate;
        loan.duration = request.duration;
        loan.startTime = block.timestamp;
        loan.creditScore = request.creditScore;
        loan.purpose = request.purpose;
        loan.status = LoanStatus.Active;
        loan.totalLended = request.fundedAmount;
        loan.lenders = request.investors;
        
        // Copiar montos de inversores
        for (uint256 i = 0; i < request.investors.length; i++) {
            address investor = request.investors[i];
            lenderAmounts[loanCounter][investor] = requestInvestments[_requestId][investor];
        }
        
        // Transferir fondos al prestatario (menos comisión)
        uint256 platformCut = (request.amount * platformFee) / 10000;
        uint256 borrowerAmount = request.amount - platformCut;
        
        payable(request.borrower).transfer(borrowerAmount);
        payable(owner()).transfer(platformCut);
        
        // Actualizar perfiles
        userProfiles[request.borrower].activeLoans++;
        userProfiles[request.borrower].totalBorrowed += request.amount;
        
        request.active = false;
        
        emit LoanFunded(loanCounter, request.borrower, request.amount);
    }

    // Pagar préstamo
    function repayLoan(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(msg.sender == loan.borrower, "Only borrower can repay");
        
        uint256 totalDue = loan.amount + (loan.amount * loan.interestRate / 10000);
        require(msg.value >= totalDue, "Insufficient payment");
        
        loan.status = LoanStatus.Repaid;
        loan.repaidAmount = totalDue;
        
        // Distribuir a prestamistas
        for (uint256 i = 0; i < loan.lenders.length; i++) {
            address lender = loan.lenders[i];
            uint256 lenderShare = lenderAmounts[_loanId][lender];
            uint256 lenderReturn = (totalDue * lenderShare) / loan.amount;
            payable(lender).transfer(lenderReturn);
            
            userProfiles[lender].totalEarned += (lenderReturn - lenderShare);
        }
        
        // Actualizar perfil del prestatario
        userProfiles[loan.borrower].totalRepaid += loan.amount;
        userProfiles[loan.borrower].activeLoans--;
        userProfiles[loan.borrower].completedLoans++;
        
        // Devolver exceso
        if (msg.value > totalDue) {
            payable(msg.sender).transfer(msg.value - totalDue);
        }
        
        emit LoanRepaid(_loanId, msg.sender, totalDue);
    }

    // Funciones de consulta
    function getLoan(uint256 _id) external view returns (Loan memory) {
        return loans[_id];
    }
    
    function getLoanRequest(uint256 _id) external view returns (
        uint256 id,
        address borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        uint256 creditScore,
        string memory purpose,
        bool active,
        uint256 fundedAmount
    ) {
        LoanRequest storage request = loanRequests[_id];
        return (
            request.id,
            request.borrower,
            request.amount,
            request.interestRate,
            request.duration,
            request.creditScore,
            request.purpose,
            request.active,
            request.fundedAmount
        );
    }
    
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return userProfiles[_user];
    }
}