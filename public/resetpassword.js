document.addEventListener('DOMContentLoaded', function () {
    const resetForm = document.getElementById('resetForm');
    const newPasswordInput = resetForm.elements.newPassword;
    const confirmPasswordInput = resetForm.elements.confirmPassword;
    const successMessage = document.getElementById('successMessage');

    resetForm.addEventListener('submit', function (event) {
      event.preventDefault();
  
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
  
      if (newPassword !== confirmPassword) {
        // Show an error message that passwords don't match
        errorMessage.textContent = "Password and Confirm Password should match.";
        return;
      }
  
      const token = getQueryParam('token');
      if (!token) {
        // Handle missing token error
        errorMessage.textContent = "Invalid token.";
        return;
      }
  
      const data = {
        token: token,
        password: newPassword
      };
  
      // Perform the AJAX request to reset the password
      // Replace 'API_URL' with your actual API endpoint URL
      fetch('https://customer-info-central.onrender.com/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(responseData => {
        console.log(responseData);
        // Show a success message to the user
        if(responseData.status != 200){
          errorMessage.textContent = JSON.stringify(responseData.message || 'Server Error');
          return;
        }
        successMessage.classList.remove('d-none');
        resetForm.reset();
      })
      .catch(error => {
        console.error(error);
        errorMessage.textContent = JSON.stringify(error.message || 'Server Error');
        // Show an error message to the user
      });
    });
  
    function getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }
  });
  