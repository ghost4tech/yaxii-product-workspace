import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Store, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Settings,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProductStore } from '@/stores/productStore';
import { WooCommerceConfig } from '@/types/product';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { testConnection as testWooConnection, fetchCategories } from '@/services/woocommerce';

const configSchema = z.object({
  storeUrl: z.string().url('Please enter a valid URL'),
  consumerKey: z.string().min(1, 'Consumer key is required'),
  consumerSecret: z.string().min(1, 'Consumer secret is required'),
});

interface ConnectionStatusProps {
  onOpenSettings: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onOpenSettings }) => {
  const { wooConfig } = useProductStore();

  if (!wooConfig?.connected) {
    return (
      <Button onClick={onOpenSettings} variant="outline" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        Connect Store
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="text-muted-foreground">Connected</span>
      </div>
      <Button onClick={onOpenSettings} variant="ghost" size="icon" className="h-8 w-8">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const WooCommerceSetup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState(false);
  const { wooConfig, setWooConfig, setCategories } = useProductStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      storeUrl: wooConfig?.storeUrl || '',
      consumerKey: wooConfig?.consumerKey || '',
      consumerSecret: wooConfig?.consumerSecret || '',
    },
  });

  const handleTestConnection = async (values: z.infer<typeof configSchema>) => {
    setIsConnecting(true);
    setConnectionError(null);
    setIsCorsError(false);
    
    try {
      // Normalize URL
      const storeUrl = values.storeUrl.replace(/\/$/, '');
      
      // Test the connection with real API
      const result = await testWooConnection(storeUrl, values.consumerKey, values.consumerSecret);
      
      if (!result.success) {
        if (result.error === 'CORS_BLOCKED') {
          setIsCorsError(true);
          setConnectionError('Your WooCommerce store is blocking requests from this application.');
          return;
        }
        setConnectionError(result.error || 'Connection failed');
        return;
      }
      
      // Connection successful - now fetch categories
      const tempConfig: WooCommerceConfig = {
        storeUrl,
        consumerKey: values.consumerKey,
        consumerSecret: values.consumerSecret,
        connected: false,
        lastSync: undefined,
      };
      
      const categoriesResult = await fetchCategories(tempConfig);
      
      if (categoriesResult.error) {
        setConnectionError(`Connected but failed to fetch categories: ${categoriesResult.error}`);
        return;
      }
      
      setCategories(categoriesResult.categories);
      
      const config: WooCommerceConfig = {
        storeUrl,
        consumerKey: values.consumerKey,
        consumerSecret: values.consumerSecret,
        connected: true,
        lastSync: new Date(),
      };
      
      setWooConfig(config);
      
      toast({
        title: 'Connected successfully!',
        description: `Synced ${categoriesResult.categories.length} categories from your store.`,
      });
      
      setIsOpen(false);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWooConfig(null);
    setCategories([]);
    form.reset({
      storeUrl: '',
      consumerKey: '',
      consumerSecret: '',
    });
    toast({
      title: 'Disconnected',
      description: 'Your store has been disconnected.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <span>
          <ConnectionStatus onOpenSettings={() => setIsOpen(true)} />
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            WooCommerce Connection
          </DialogTitle>
          <DialogDescription>
            Connect to your WooCommerce store to sync categories and push products.
          </DialogDescription>
        </DialogHeader>

        {wooConfig?.connected ? (
          <div className="space-y-4">
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-medium">Store Connected</p>
                    <p className="text-sm text-muted-foreground">
                      {wooConfig.storeUrl}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(wooConfig.storeUrl + '/wp-admin', '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open WP Admin
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleTestConnection)} className="space-y-4">
              <FormField
                control={form.control}
                name="storeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://yourstore.com"
                        type="url"
                      />
                    </FormControl>
                    <FormDescription>
                      Your WooCommerce store URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consumerKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ck_..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consumerSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Secret</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="cs_..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {connectionError && (
                <Alert variant={isCorsError ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{isCorsError ? 'CORS Configuration Required' : 'Connection Error'}</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{connectionError}</p>
                    {isCorsError && (
                      <div className="text-sm mt-2 space-y-1">
                        <p className="font-medium">To fix this, add CORS headers to your WordPress site:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>Install the "WP CORS" plugin on your WordPress site</li>
                          <li>Or add this to your .htaccess file:</li>
                        </ol>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Authorization, Content-Type"`}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p className="font-medium mb-1">Where to find your API keys:</p>
                <p>
                  WP Admin → WooCommerce → Settings → Advanced → REST API → Add Key
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Connect Store
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
