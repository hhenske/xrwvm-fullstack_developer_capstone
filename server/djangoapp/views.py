# from django.shortcuts import render
# from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
from django.contrib.auth.models import User
# from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth import logout
# from django.contrib import messages
# from datetime import datetime
from django.http import JsonResponse
from django.contrib.auth import login, authenticate
import logging
import json
from django.views.decorators.csrf import csrf_exempt
from .populate import initiate
from .models import CarMake, CarModel
from .restapis import get_request, analyze_review_sentiments, post_review


# Get an instance of a logger
logger = logging.getLogger(__name__)


# Create your views here.

# Create a `login_request` view to handle sign in request
@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    try:
        data = json.loads(request.body)
        username = data.get('userName')
        password = data.get('password')
    except (json.JSONDecodeError, KeyError):
        return JsonResponse(
            {"error": "Invalid JSON or missing fields"}, status=400)

    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"userName": username, "status": "Authenticated"})
    else:
        return JsonResponse({"error": "Invalid credentials"}, status=401)


# Create a `logout_request` view to handle sign out request
def logout_request(request):
    logout(request)
    data = {"userName": ""}
    return JsonResponse(data)


# Create a `registration` view to handle sign up request
@csrf_exempt
def register_user(request):
    # context = {}

    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    first_name = data['firstName']
    last_name = data['lastName']
    email = data['email']
    username_exist = False
    # email_exist = False
    try:
        User.objects.get(unsername=username)
        username_exist = True
    except Exception as e:
        print(f"Error: {e}")

    if not username_exist:
        # Create user in auth_user table
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
            email=email
        ) 
        # Login the user and redirect to list page
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
        return JsonResponse(data)
    else:
        data = {"userName": username, "error": "Already Registered"}
        return JsonResponse(data)


def get_cars(request):
    count = CarMake.objects.filter().count()
    print(count)
    if (count == 0):
        initiate()
    car_models = CarModel.objects.select_related('car_make')
    cars = []
    for car_model in car_models:
        cars.append({
            "CarModel": car_model.name,
            "CarMake": car_model.car_make.name
            })
    return JsonResponse({"CarModels": cars})


def get_dealerships(request, state="All"):
    print(f"DEBUG: get_dealerships called with state: {state}")
    if (state == "All"):
        endpoint = "/fetchDealers"
    else:
        endpoint = "/fetchDealers/"+state
    dealerships = get_request(endpoint)
    print("DEBUG get_request returned: ", dealerships)
    return JsonResponse({"status": 200, "dealers": dealerships})


# Create a `get_dealer_reviews` view to render the reviews of a dealer
# def get_dealer_reviews(request, dealer_id):

#     if(dealer_id):
#         endpoint = "/fetchReviews/dealer/"+str(dealer_id)
#         reviews = get_request(endpoint)
#         for review_detail in reviews:
#             response = analyze_review_sentiments(review_detail['review'])
#             print(response)
#             review_detail['sentiment'] = response['sentiment']
#         return JsonResponse({"status":200,"reviews":reviews})
#     else:
#         return JsonResponse({"status":400,"message":"Bad Request"})

def get_dealer_reviews(request, dealer_id):
    if not dealer_id:
        return JsonResponse({"status": 400, "message": "Bad Request"})

    endpoint = "/fetchReviews/dealer/" + str(dealer_id)
    print(f"DEBUG: Fetching reviews with endpoint: {endpoint}")

    reviews = get_request(endpoint)
    print(f"DEBUG: get_request returned: {reviews}")

    if reviews is None:
        return JsonResponse({
            "status": 500,
            "message": "Failed to fetch reviews"
            })

    # Handle case where no reviews exist (empty list)
    if not reviews:
        return JsonResponse({"status": 200, "reviews": []})

    # Ensure reviews is a list
    if not isinstance(reviews, list):
        return JsonResponse({
            "status": 500,
            "message": "Invalid reviews data format"
            })

    # Add sentiment analysis to each review
    for review_detail in reviews:
        try:
            if 'review' in review_detail and review_detail['review']:
                response = analyze_review_sentiments(review_detail['review'])
                print(f"DEBUG: Sentiment response: {response}")

                if response and 'sentiment' in response:
                    review_detail['sentiment'] = response['sentiment']
                else:
                    review_detail['sentiment'] = 'neutral'  # fallback
            else:
                review_detail['sentiment'] = 'neutral'
        except Exception as e:
            print(f"DEBUG: Sentiment analysis failed for review: {e}")
            review_detail['sentiment'] = 'neutral'  # fallback on error

    return JsonResponse({"status": 200, "reviews": reviews})


# Create a `get_dealer_details` view to render the dealer details
def get_dealer_details(request, dealer_id):
    if (dealer_id):
        endpoint = "/fetchDealer/"+str(dealer_id)
        dealership = get_request(endpoint)
        return JsonResponse({"status": 200, "dealer": dealership})
    else:
        return JsonResponse({"status": 400, "message": "Bad Request"})


# Create a `add_review` view to submit a review
# Create a `add_review` view to submit a review
@csrf_exempt  # Add this line
def add_review(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"DEBUG: Received review data: {data}")
            
            response = post_review(data)
            print(f"DEBUG: post_review response: {response}")
            
            return JsonResponse({"status": 200})
        except Exception as e:
            print(f"DEBUG: Error in add_review: {e}")
            return JsonResponse({"status": 401,
                "message": "Error in posting review"})
    else:
        return JsonResponse({"status": 405, "message": "Method not allowed"})
