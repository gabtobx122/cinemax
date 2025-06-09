$(document).ready(function() {
    // Global variables
    let selectedMovie = null;
    let selectedSeats = [];
    const prices = {
        adult: 15.00,
        child: 8.00,
        senior: 10.00
    };
    
    // Initialize date picker with current date and valid dates
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 15); // Allow booking up to 14 days in advance
    
    const formatDate = date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    $('#dateSelect').attr('min', formatDate(today));
    $('#dateSelect').attr('max', formatDate(maxDate));
    $('#dateSelect').val(formatDate(today));
    
    // Generate seating plan
    function generateSeats() {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsPerRow = 12;
        const seatingPlan = $('.seating-plan');
        seatingPlan.empty();
        
        // Generate random occupied seats
        const occupiedSeats = [];
        for (let i = 0; i < 25; i++) {
            const randomRow = rows[Math.floor(Math.random() * rows.length)];
            const randomSeat = Math.floor(Math.random() * seatsPerRow) + 1;
            const seatId = `${randomRow}${randomSeat}`;
            if (!occupiedSeats.includes(seatId)) {
                occupiedSeats.push(seatId);
            }
        }
        
        // Create rows and seats
        rows.forEach(row => {
            const seatRow = $('<div>').addClass('seat-row');
            seatRow.append($('<div>').addClass('row-label').text(row));
            
            for (let i = 1; i <= seatsPerRow; i++) {
                const seatId = `${row}${i}`;
                const seat = $('<div>').addClass('seat').attr('data-seat-id', seatId).text(i);
                
                if (occupiedSeats.includes(seatId)) {
                    seat.addClass('occupied');
                } else {
                    seat.addClass('available');
                    
                    // Add click event for available seats
                    seat.on('click', function() {
                        if ($(this).hasClass('selected')) {
                            $(this).removeClass('selected');
                            selectedSeats = selectedSeats.filter(id => id !== seatId);
                        } else {
                            // Check if we already have as many seats as tickets
                            const totalTickets = getTotalTickets();
                            if (selectedSeats.length >= totalTickets && totalTickets > 0) {
                                alert('You cannot select more seats than tickets. Please adjust your ticket count or deselect some seats.');
                                return;
                            }
                            
                            $(this).addClass('selected');
                            selectedSeats.push(seatId);
                        }
                        
                        updateSummary();
                    });
                }
                
                seatRow.append(seat);
            }
            
            seatingPlan.append(seatRow);
        });
    }
    
    // Handle movie selection
    $('.movie-card').on('click', function() {
        const movieId = $(this).data('movie-id');
        const movieTitle = $(this).find('h3').text();
        
        // Update selected movie
        selectedMovie = {
            id: movieId,
            title: movieTitle
        };
        
        // Update UI
        $('.movie-card').removeClass('selected');
        $(this).addClass('selected');
        $('#movieSelect').val(movieTitle);
        
        // Scroll to booking form
        $('html, body').animate({
            scrollTop: $('#bookingForm').offset().top - 100
        }, 500);
        
        updateSummary();
    });
    
    // Book now button click
    $('.btn-book').on('click', function(e) {
        e.stopPropagation();
        const movieCard = $(this).closest('.movie-card');
        movieCard.trigger('click');
    });
    
    // Handle counter buttons
    $('.counter-btn').on('click', function() {
        const isIncrease = $(this).hasClass('increase');
        const input = $(this).siblings('input');
        let value = parseInt(input.val());
        
        if (isIncrease) {
            if (value < parseInt(input.attr('max'))) {
                value++;
            }
        } else {
            if (value > parseInt(input.attr('min'))) {
                value--;
            }
        }
        
        input.val(value);
        
        // Update seat selection based on ticket count
        const totalTickets = getTotalTickets();
        
        // If we have more selected seats than tickets, deselect the excess seats
        if (selectedSeats.length > totalTickets && totalTickets > 0) {
            // Remove excess seats starting from the last one
            const seatsToKeep = selectedSeats.slice(0, totalTickets);
            
            // Update UI for deselected seats
            selectedSeats.forEach(seatId => {
                if (!seatsToKeep.includes(seatId)) {
                    $(`.seat[data-seat-id="${seatId}"]`).removeClass('selected');
                }
            });
            
            selectedSeats = seatsToKeep;
        }
        
        updateSummary();
    });
    
    // Helper function to get total tickets
    function getTotalTickets() {
        return parseInt($('input[name="adultTickets"]').val()) +
               parseInt($('input[name="childTickets"]').val()) +
               parseInt($('input[name="seniorTickets"]').val());
    }
    
    // Payment method change
    $('input[name="paymentMethod"]').on('change', function() {
        if ($(this).val() === 'creditCard' || $(this).val() === 'debit') {
            $('#cardDetails').show();
        } else {
            $('#cardDetails').hide();
        }
    });
    
    // Update booking summary
    function updateSummary() {
        // Movie info
        $('#summaryMovie').text(selectedMovie ? selectedMovie.title : '--');
        
        // Theater info
        const selectedTheater = $('#theaterSelect option:selected').text();
        $('#summaryTheater').text(selectedTheater !== 'Choose Theater' ? selectedTheater : '--');
        
        // Date info
        const selectedDate = $('#dateSelect').val();
        $('#summaryDate').text(selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '--');
        
        // Time info
        const selectedTime = $('#timeSelect').val();
        $('#summaryTime').text(selectedTime || '--');
        
        // Seats info
        $('#summarySeats').text(selectedSeats.length > 0 ? selectedSeats.sort().join(', ') : '--');
        
        // Tickets info
        const adultTickets = parseInt($('input[name="adultTickets"]').val());
        const childTickets = parseInt($('input[name="childTickets"]').val());
        const seniorTickets = parseInt($('input[name="seniorTickets"]').val());
        
        $('#summaryAdult').text(`${adultTickets} × $${prices.adult.toFixed(2)}`);
        $('#summaryChild').text(`${childTickets} × $${prices.child.toFixed(2)}`);
        $('#summarySenior').text(`${seniorTickets} × $${prices.senior.toFixed(2)}`);
        
        // Calculate total
        const total = (adultTickets * prices.adult) + 
                      (childTickets * prices.child) + 
                      (seniorTickets * prices.senior);
        
        $('#summaryTotal').text(`$${total.toFixed(2)}`);
    }
    
    // Form validation
    function validateForm() {
        if (!selectedMovie) {
            alert('Please select a movie.');
            return false;
        }
        
        if ($('#theaterSelect').val() === '') {
            alert('Please select a theater.');
            return false;
        }
        
        if ($('#dateSelect').val() === '') {
            alert('Please select a date.');
            return false;
        }
        
        if ($('#timeSelect').val() === '') {
            alert('Please select a time.');
            return false;
        }
        
        const totalTickets = getTotalTickets();
        if (totalTickets === 0) {
            alert('Please select at least one ticket.');
            return false;
        }
        
        if (selectedSeats.length !== totalTickets) {
            alert(`Please select ${totalTickets} seats to match your ticket count.`);
            return false;
        }
        
        if ($('#customerName').val() === '') {
            alert('Please enter your name.');
            return false;
        }
        
        if ($('#customerEmail').val() === '') {
            alert('Please enter your email.');
            return false;
        }
        
        if ($('#customerPhone').val() === '') {
            alert('Please enter your phone number.');
            return false;
        }
        
        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        if ((paymentMethod === 'creditCard' || paymentMethod === 'debit') && $('#cardNumber').val() === '') {
            alert('Please enter your card number.');
            return false;
        }
        
        if (!$('#termsAgreement').is(':checked')) {
            alert('Please agree to the terms and conditions.');
            return false;
        }
        
        return true;
    }
    
    // Form submission
    $('#cinemaBookingForm').on('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            // Hide booking form and show confirmation
            $('.booking-form').hide();
            
            // Generate random booking ID
            const bookingId = 'BOK' + Math.floor(Math.random() * 10000000000);
            $('#confirmationId').text(bookingId);
            
            // Populate confirmation details
            $('#confirmationMovie').text($('#summaryMovie').text());
            $('#confirmationTheater').text($('#summaryTheater').text());
            $('#confirmationDateTime').text($('#summaryDate').text() + ' at ' + $('#summaryTime').text());
            $('#confirmationSeats').text($('#summarySeats').text());
            $('#confirmationTotal').text($('#summaryTotal').text());
            
            
            $('#bookingConfirmation').show();
            
            
            $('html, body').animate({
                scrollTop: $('#bookingConfirmation').offset().top - 100
            }, 500);
        }
    });
    
    
    $('#resetBtn').on('click', function() {
        resetForm();
    });
    
    
    $('#newBookingBtn').on('click', function() {
        resetForm();
        $('#bookingConfirmation').hide();
        $('.booking-form').show();
        
        
        $('html, body').animate({
            scrollTop: $('.movie-selection').offset().top - 100
        }, 500);
    });
    
    
    function resetForm() {
        
        selectedMovie = null;
        $('.movie-card').removeClass('selected');
        $('#movieSelect').val('');
        
       
        $('#theaterSelect').val('');
        $('#dateSelect').val(formatDate(today));
        $('#timeSelect').val('');
        $('input[name="adultTickets"]').val(0);
        $('input[name="childTickets"]').val(0);
        $('input[name="seniorTickets"]').val(0);
        $('#customerName').val('');
        $('#customerEmail').val('');
        $('#customerPhone').val('');
        $('#cardNumber').val('');
        $('#cardExpiry').val('');
        $('#cardCVV').val('');
        $('#cardName').val('');
        $('#termsAgreement').prop('checked', false);
        
       
        selectedSeats = [];
        generateSeats();
        
       
        updateSummary();
    }
    
    
    $('#cardNumber').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 16) {
            value = value.substr(0, 16);
        }
        
        
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        
        $(this).val(formattedValue);
    });
    
    
    $('#cardExpiry').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 4) {
            value = value.substr(0, 4);
        }
        
    
        if (value.length > 2) {
            value = value.substr(0, 2) + '/' + value.substr(2);
        }
        
        $(this).val(value);
    });
    
    
    $('#cardCVV').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 3) {
            value = value.substr(0, 3);
        }
        
        $(this).val(value);
    });
    
    
    generateSeats();
    
    
    updateSummary();
});