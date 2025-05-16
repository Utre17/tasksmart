import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

const simplePasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email")
});

type SimplePasswordResetFormValues = z.infer<typeof simplePasswordResetSchema>;

interface SimplePasswordResetFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export default function SimplePasswordResetForm({ onSuccess, onCancel }: SimplePasswordResetFormProps) {
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<SimplePasswordResetFormValues>({
    resolver: zodResolver(simplePasswordResetSchema),
    defaultValues: {
      email: ""
    },
  });

  const onSubmit = async (values: SimplePasswordResetFormValues) => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      await resetPassword(values.email);
      setEmailSent(true);
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
      });
      
      // We don't call onSuccess immediately as we want to show confirmation
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
      
      toast({
        title: "Password reset failed",
        description: err.message || "Unable to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          {emailSent 
            ? "Check your email for a link to reset your password" 
            : "Enter your email address and we'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!emailSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        type="email" 
                        {...field} 
                        className="bg-gray-50" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="text-sm text-red-500 font-medium">{error}</div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : "Send Reset Link"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </p>
            <div className="flex gap-2">
              <Button type="button" className="w-full" onClick={() => {
                if (onSuccess) onSuccess();
              }}>
                Return to Login
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 