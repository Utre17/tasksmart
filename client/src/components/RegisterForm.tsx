const onSubmit = async (values: RegisterFormValues) => {
  setError(null);
  // Remove confirmPassword before sending
  const { confirmPassword, ...registerData } = values;
  
  try {
    await register(registerData, {
      onSuccess: async () => {
        // If it's a guest account and there are tasks to transfer
        if (isGuest && transferTasks && guestTaskCount > 0) {
          await transferGuestTasks();
        }
        
        // Clear any guest banners/preferences that might have been saved
        localStorage.removeItem("guest_banner_dismissed");
        localStorage.removeItem("guest_conversion_banner_dismissed");
        localStorage.removeItem("guest_preferences");
        
        if (onSuccess) onSuccess();
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || "Registration failed");
      },
    });
  } catch (error: any) {
    setError(error.message || "Registration failed");
  }
}; 